"""
Builds the web-sized copies of the images the site actually loads.

The repository keeps every figure at the resolution it was authored in, which is
right for the archive and wrong for the page: index.html pulled 7.8 MB of
1920x1080 PNG before a visitor scrolled at all, and publications.html pulled
26 MB of teasers in order to draw them 176 pixels tall. This script leaves the
originals untouched and writes the copies the pages reference:

  full-bleed backdrops   images/<name>.webp          same resolution
  publication teasers    images/thumbs/<...>.webp    capped at THUMB_HEIGHT

Run it after adding or replacing any image:

    python tools/optimize-images.py            # only what is out of date
    python tools/optimize-images.py --force    # rebuild everything

Teasers are discovered from js/publications-data.js, so adding a paper needs no
change here. Until the script is re-run the new paper simply has no thumbnail
and its card falls back to the original path - see renderTeasers in
js/publications.js.


Choosing a codec
----------------
Each still is encoded twice, lossy and lossless, and the better of the two is
kept. That is not belt-and-braces: the two kinds of image on this site want
opposite settings.

Renders and photographs compress well lossily and badly losslessly - VeachAjar
is 802K at q95 against 2.9 MB lossless - and their quality ceiling is around
38-41 dB, because Monte Carlo noise is high-frequency detail that no encoder
stores cheaply.

Diagrams with flat saturated fills behave the other way. WebP's lossy mode
subsamples chroma 4:2:0, and on a false-colour partition figure that is a fixed
error the quality setting cannot touch: Visualization_Large_Nontrivially/t2 sits
at 29.3 dB at q85 and 30.2 dB at q98, for 39K more bytes. Lossless costs 2.2x
the lossy bytes there and is exact, so lossless wins.

Hence LOSSLESS_WHEN_BELOW / LOSSLESS_SIZE_RATIO: take the exact copy when the
lossy one is not visually clean and the exact one is not much larger.

PSNR in the output is measured against the source at the *output* resolution, so
it reports the codec's loss alone and not the loss from downscaling. It is
measured on the image composited over grey, because the RGB stored in fully
transparent pixels is arbitrary and lossy WebP does not preserve it - comparing
it raw scored clean figures at 19 dB.
"""

import argparse
import io
import math
import re
import struct
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageSequence

ROOT = Path(__file__).resolve().parent.parent

# Shown at full window width, so they keep their resolution and only change
# container. These are rendered images stored as PNG, a format that costs them
# roughly 7x with nothing to show for it. Quality is high because these are the
# only images on the site displayed at their native size.
FULL_BLEED = [
    'images/VeachAjar.png',
    'images/backdrop.png',
    'images/other_dragon_2.png',
]
FULL_BLEED_QUALITY = 95

# .pub-teaser is 11rem tall, 9rem in the compact cards on index.html. 480px
# covers the larger of those on a 2.5x display, and every teaser is wider than
# it is tall, so height is the binding dimension. The browser then scales these
# down by about 2.7x again, which hides codec noise - hence the lower quality
# than the full-bleed set.
THUMB_DIR = 'images/thumbs'
THUMB_HEIGHT = 480
THUMB_QUALITY = 90

# Animation is the one place per-frame quality is not affordable: the source GIF
# is 13 MB over 196 frames. Even q65 holds 42.9 dB; 75 leaves margin and still
# lands two orders of magnitude below the GIF.
ANIM_QUALITY = 75

# Prefer the exact copy when the lossy one is below this and costs less than
# this multiple of it. See "Choosing a codec" above.
LOSSLESS_WHEN_BELOW = 40.0
LOSSLESS_SIZE_RATIO = 2.5

DATA_FILE = 'js/publications-data.js'


def visible(image):
    """The image as a viewer sees it: composited over grey.

    Fully transparent pixels carry arbitrary RGB that lossy WebP is free to
    discard, so comparing the raw channels measures noise in regions that are
    never drawn."""
    if image.mode != 'RGBA':
        return image.convert('RGB')

    backdrop = Image.new('RGB', image.size, (128, 128, 128))
    backdrop.paste(image, mask=image.getchannel('A'))
    return backdrop


def psnr(reference, candidate):
    """Peak signal-to-noise ratio in dB between two same-size images."""
    a = np.asarray(visible(reference), dtype=np.float64)
    b = np.asarray(visible(candidate), dtype=np.float64)
    mse = ((a - b) ** 2).mean()

    if mse == 0:
        return math.inf

    return 10 * math.log10(255.0 ** 2 / mse)


def fit_height(size, max_height):
    """New (w, h) capped at max_height. Never upscales: some teasers are wide
    strips already shorter than the cap, and enlarging them would spend bytes
    inventing detail that is not there."""
    width, height = size

    if max_height is None or height <= max_height:
        return width, height

    return max(1, round(width * max_height / height)), max_height


def prepare(image, max_height):
    """Source image in the mode and at the size it will be written in. RGBA only
    where there is real transparency - an unused alpha channel costs size."""
    transparent = image.mode in ('RGBA', 'LA') or (image.mode == 'P' and 'transparency' in image.info)
    prepared = image.convert('RGBA' if transparent else 'RGB')
    target = fit_height(prepared.size, max_height)

    if target != prepared.size:
        prepared = prepared.resize(target, Image.LANCZOS)

    return prepared


def encode(image, **options):
    buffer = io.BytesIO()
    image.save(buffer, 'WEBP', method=6, **options)
    return buffer.getvalue()


def encode_still(src, max_height, quality):
    with Image.open(src) as image:
        source = prepare(image, max_height)
        native = prepare(image, None)

    lossy = encode(source, quality=quality)

    with Image.open(io.BytesIO(lossy)) as decoded:
        score = psnr(source, decoded)

    # Downscaling is usually the cheapest win available, but on a diagram of flat
    # fills it is the opposite: LANCZOS antialiasing turns the 5 colours of
    # Visualization_Large_Nontrivially/t3 into 3497, and lossless goes from 6K at
    # native size to 37K at 480px. So the full-size exact copy competes too, and
    # on those figures it wins outright - smaller than the source PNG, and with
    # no resampling at all.
    exact = min(
        [encode(source, lossless=True, quality=100)] +
        ([encode(native, lossless=True, quality=100)] if native.size != source.size else []),
        key=len,
    )

    prefer_exact = (
        len(exact) <= len(lossy) or
        (score < LOSSLESS_WHEN_BELOW and len(exact) <= len(lossy) * LOSSLESS_SIZE_RATIO)
    )

    if prefer_exact:
        with Image.open(io.BytesIO(exact)) as decoded:
            size = decoded.size
        return exact, math.inf, f'{size[0]}x{size[1]} lossless'

    return lossy, score, f'{source.width}x{source.height} q{quality}'


def frame_durations(data):
    """Per-frame durations read out of the WebP container's ANMF chunks.

    Pillow writes them correctly but its reader does not expose them, so the
    only way to prove the animation still runs for as long as the GIF did is to
    walk the RIFF chunks."""
    durations = []
    offset = 12

    while offset + 8 <= len(data):
        tag = data[offset:offset + 4]
        size = struct.unpack('<I', data[offset + 4:offset + 8])[0]

        if tag == b'ANMF':
            body = data[offset + 8:offset + 8 + size]
            durations.append(struct.unpack('<I', body[12:15] + b'\x00')[0])

        # VP8X is a header, not a container: its payload is not walkable.
        offset += 8 + size + (size & 1)

    return durations


def encode_animation(src, max_height, quality):
    with Image.open(src) as image:
        frames = []
        durations = []

        for frame in ImageSequence.Iterator(image):
            # Pillow composites GIF disposal on seek, so each frame arrives
            # whole; convert out of the palette before resizing so the palette
            # itself is not resampled.
            frames.append(prepare(frame.convert('RGBA'), max_height))
            durations.append(frame.info.get('duration', 100))

        loop = image.info.get('loop', 0)

    buffer = io.BytesIO()
    frames[0].save(
        buffer,
        'WEBP',
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=loop,
        quality=quality,
        # 196 frames at method=6 is minutes of encoding for a fraction of a
        # percent; 4 is the useful end of the curve here.
        method=4,
        minimize_size=True,
    )
    data = buffer.getvalue()

    written = frame_durations(data)

    # minimize_size merges runs of identical frames and sums their durations, so
    # the frame count legitimately drops while the running time must not.
    if sum(written) != sum(durations):
        raise SystemExit(f'{src}: animation runs {sum(written)}ms, source runs {sum(durations)}ms')

    with Image.open(io.BytesIO(data)) as decoded:
        score = psnr(frames[0], decoded.convert('RGBA'))

    size = frames[0].size
    return data, score, f'{size[0]}x{size[1]} q{quality}, {len(written)}/{len(frames)} frames, {sum(written) / 1000:.1f}s'


def is_animated(path):
    with Image.open(path) as image:
        return getattr(image, 'n_frames', 1) > 1


def teaser_sources():
    """Every image path named in the publications data, in order, de-duplicated.

    Several papers share a teaser - the MDWT figures appear on two entries - so
    the same file would otherwise be encoded twice."""
    text = (ROOT / DATA_FILE).read_text(encoding='utf-8')
    found = {}

    for path in re.findall(r"'(images/[^']+)'", text):
        found.setdefault(path, None)

    return list(found)


def thumb_path(rel):
    """images/mdwt/t1.png -> images/thumbs/mdwt/t1.webp

    Mirrors the source tree, so two papers with a t1.png in different folders
    cannot collide and the mapping stays derivable in JS without a manifest."""
    stem = Path(rel).relative_to('images').with_suffix('.webp')
    return Path(THUMB_DIR) / stem


def kb(size):
    return size / 1024


def main():
    parser = argparse.ArgumentParser(description='Rebuild the web-sized copies of the site images.')
    parser.add_argument('--force', action='store_true',
                        help='re-encode even when the output is newer than its source')
    args = parser.parse_args()

    jobs = [(ROOT / rel, (ROOT / rel).with_suffix('.webp'), None, FULL_BLEED_QUALITY)
            for rel in FULL_BLEED]

    for rel in teaser_sources():
        jobs.append((ROOT / rel, ROOT / thumb_path(rel), THUMB_HEIGHT, THUMB_QUALITY))

    before = after = 0
    skipped = 0
    missing = []

    print(f'{"":<46}{"before":>9}{"after":>9}{"saved":>7}{"PSNR":>9}   detail')
    print('-' * 108)

    for src, dst, max_height, quality in jobs:
        if not src.exists():
            missing.append(src.relative_to(ROOT).as_posix())
            continue

        source_size = src.stat().st_size
        before += source_size

        if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime and not args.force:
            after += dst.stat().st_size
            skipped += 1
            continue

        if is_animated(src):
            data, score, detail = encode_animation(src, max_height, ANIM_QUALITY)
        else:
            data, score, detail = encode_still(src, max_height, quality)

        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_bytes(data)
        after += len(data)

        quality_note = '  exact' if math.isinf(score) else f'{score:>6.1f}dB'

        print(f'{dst.relative_to(ROOT).as_posix():<46}'
              f'{kb(source_size):>8,.0f}K{kb(len(data)):>8,.0f}K'
              f'{1 - len(data) / source_size:>7.0%}'
              f'{quality_note:>9}   {detail}')

    print('-' * 108)
    print(f'{"total":<46}{kb(before):>8,.0f}K{kb(after):>8,.0f}K{1 - after / before:>7.0%}')

    if skipped:
        print(f'{skipped} already up to date (--force to rebuild)')

    if missing:
        print('\nmissing sources, nothing written:', *missing, sep='\n  ')
        return 1

    return 0


if __name__ == '__main__':
    sys.exit(main())
