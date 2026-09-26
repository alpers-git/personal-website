// Image diff page: PSNR, SSIM and heat maps for two images, computed entirely in the browser.
// SSIM follows scikit-image's defaults (7x7 uniform window, K1 0.01, K2 0.03, sample covariance) so scores match tools/compare_images.py.

(function () {
  const WIN = 7;
  const K1 = 0.01;
  const K2 = 0.03;

  // matplotlib's inferno, sampled at 17 evenly spaced stops.
  const INFERNO = [
    [0, 0, 4], [11, 7, 36], [33, 12, 74], [61, 9, 101], [87, 16, 110], [113, 25, 110], [138, 34, 106],
    [163, 44, 97], [188, 55, 84], [210, 70, 68], [228, 90, 49], [241, 115, 29], [249, 142, 9],
    [252, 172, 17], [249, 203, 53], [242, 234, 105], [252, 255, 164]
  ];

  const slots = [null, null];
  const calcButton = document.querySelector('.img-diff__calc');
  const status = document.querySelector('.img-diff__status');
  const results = document.querySelector('.img-diff__results');

  function inferno(t) {
    const x = Math.min(Math.max(t, 0), 1) * (INFERNO.length - 1);
    const i = Math.min(Math.floor(x), INFERNO.length - 2);
    const f = x - i;
    const a = INFERNO[i];
    const b = INFERNO[i + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }

  // scipy's 'reflect' boundary: d c b a | a b c d | d c b a
  function reflectIndex(i, n) {
    while (i < 0 || i >= n) {
      i = i < 0 ? -i - 1 : 2 * n - i - 1;
    }
    return i;
  }

  function paddedIndices(n, r) {
    const idx = new Int32Array(n + 2 * r);
    for (let j = 0; j < idx.length; j++) {
      idx[j] = reflectIndex(j - r, n);
    }
    return idx;
  }

  // Separable box filter with running sums; tmp is scratch space of the same size.
  function boxFilter(src, dst, tmp, w, h, ix, iy, colSum) {
    const r = (WIN - 1) / 2;
    for (let y = 0; y < h; y++) {
      const row = y * w;
      let sum = 0;
      for (let j = 0; j < WIN; j++) {
        sum += src[row + ix[j]];
      }
      for (let x = 0; x < w; x++) {
        tmp[row + x] = sum / WIN;
        if (x + 1 < w) {
          sum += src[row + ix[x + 2 * r + 1]] - src[row + ix[x]];
        }
      }
    }
    colSum.fill(0);
    for (let j = 0; j < WIN; j++) {
      const row = iy[j] * w;
      for (let x = 0; x < w; x++) {
        colSum[x] += tmp[row + x];
      }
    }
    for (let y = 0; y < h; y++) {
      const out = y * w;
      for (let x = 0; x < w; x++) {
        dst[out + x] = colSum[x] / WIN;
      }
      if (y + 1 < h) {
        const add = iy[y + 2 * r + 1] * w;
        const sub = iy[y] * w;
        for (let x = 0; x < w; x++) {
          colSum[x] += tmp[add + x] - tmp[sub + x];
        }
      }
    }
  }

  function compare(a, b, w, h) {
    const n = w * h;
    const r = (WIN - 1) / 2;
    const ix = paddedIndices(w, r);
    const iy = paddedIndices(h, r);
    const colSum = new Float64Array(w);
    const prod = new Float32Array(n);
    const tmp = new Float32Array(n);
    const ux = new Float32Array(n);
    const uy = new Float32Array(n);
    const uxx = new Float32Array(n);
    const uyy = new Float32Array(n);
    const uxy = new Float32Array(n);
    const ssimMap = new Float32Array(n);
    const errMap = new Float32Array(n);
    const c1 = K1 * K1;
    const c2 = K2 * K2;
    const covNorm = (WIN * WIN) / (WIN * WIN - 1);
    let sqErr = 0;

    for (let c = 0; c < 3; c++) {
      for (let i = 0; i < n; i++) {
        prod[i] = a[i * 4 + c] / 255;
      }
      boxFilter(prod, ux, tmp, w, h, ix, iy, colSum);
      for (let i = 0; i < n; i++) {
        prod[i] = b[i * 4 + c] / 255;
      }
      boxFilter(prod, uy, tmp, w, h, ix, iy, colSum);
      for (let i = 0; i < n; i++) {
        const v = a[i * 4 + c] / 255;
        prod[i] = v * v;
      }
      boxFilter(prod, uxx, tmp, w, h, ix, iy, colSum);
      for (let i = 0; i < n; i++) {
        const v = b[i * 4 + c] / 255;
        prod[i] = v * v;
      }
      boxFilter(prod, uyy, tmp, w, h, ix, iy, colSum);
      for (let i = 0; i < n; i++) {
        prod[i] = (a[i * 4 + c] / 255) * (b[i * 4 + c] / 255);
      }
      boxFilter(prod, uxy, tmp, w, h, ix, iy, colSum);

      for (let i = 0; i < n; i++) {
        const mx = ux[i];
        const my = uy[i];
        const vx = covNorm * (uxx[i] - mx * mx);
        const vy = covNorm * (uyy[i] - my * my);
        const vxy = covNorm * (uxy[i] - mx * my);
        const s = ((2 * mx * my + c1) * (2 * vxy + c2)) / ((mx * mx + my * my + c1) * (vx + vy + c2));
        ssimMap[i] += s / 3;
        const d = (a[i * 4 + c] - b[i * 4 + c]) / 255;
        errMap[i] += Math.abs(d) / 3;
        sqErr += d * d;
      }
    }

    // Mean SSIM ignores the border that the filter had to reflect into, as scikit-image does.
    let ssimSum = 0;
    for (let y = r; y < h - r; y++) {
      for (let x = r; x < w - r; x++) {
        ssimSum += ssimMap[y * w + x];
      }
    }
    const ssim = ssimSum / ((w - 2 * r) * (h - 2 * r));
    const mse = sqErr / (n * 3);
    const psnr = mse === 0 ? Infinity : 10 * Math.log10(1 / mse);

    for (let i = 0; i < n; i++) {
      ssimMap[i] = 1 - ssimMap[i];
    }
    return { psnr: psnr, ssim: ssim, dissim: ssimMap, err: errMap };
  }

  function formatTick(v) {
    return Number(v.toPrecision(3)).toString();
  }

  // Draws the map at native resolution with a colorbar legend baked into the same canvas, so the saved PNG carries it.
  function drawHeatMap(canvas, map, w, h) {
    let vmax = 0;
    for (let i = 0; i < map.length; i++) {
      if (map[i] > vmax) {
        vmax = map[i];
      }
    }
    vmax = Math.max(vmax, 1e-6);

    const s = Math.max(1, h / 400);
    const font = Math.round(13 * s);
    const pad = Math.ceil(font / 2 + 2 * s);
    const gap = Math.round(14 * s);
    const barW = Math.round(20 * s);
    const tickLen = Math.round(5 * s);
    const labelW = Math.round(56 * s);
    canvas.width = w + gap + barW + tickLen + labelW;
    canvas.height = Math.max(h, 2 * pad + 40);

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#222831';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = ctx.createImageData(w, h);
    for (let i = 0; i < map.length; i++) {
      const rgb = inferno(map[i] / vmax);
      img.data[i * 4] = rgb[0];
      img.data[i * 4 + 1] = rgb[1];
      img.data[i * 4 + 2] = rgb[2];
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);

    const barX = w + gap;
    const barTop = pad;
    const barH = canvas.height - 2 * pad;
    for (let y = 0; y < barH; y++) {
      const rgb = inferno(1 - y / (barH - 1));
      ctx.fillStyle = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
      ctx.fillRect(barX, barTop + y, barW, 1);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = Math.max(1, s);
    ctx.strokeRect(barX, barTop, barW, barH);

    const ticks = barH > 150 ? 5 : 3;
    ctx.fillStyle = '#ffffff';
    ctx.font = font + "px 'Roboto Condensed', sans-serif";
    ctx.textBaseline = 'middle';
    for (let t = 0; t < ticks; t++) {
      const f = t / (ticks - 1);
      const y = barTop + barH * (1 - f);
      ctx.beginPath();
      ctx.moveTo(barX + barW, y);
      ctx.lineTo(barX + barW + tickLen, y);
      ctx.stroke();
      ctx.fillText(formatTick(vmax * f), barX + barW + tickLen + 3 * s, y);
    }
  }

  function readPixels(bitmap) {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    return ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
  }

  function updateButton() {
    calcButton.disabled = !(slots[0] && slots[1]);
  }

  function loadFile(zone, file) {
    if (!file || !file.type.startsWith('image/')) {
      status.textContent = 'That is not an image file.';
      return;
    }
    const slot = Number(zone.dataset.slot);
    const preview = zone.querySelector('.drop-zone__preview');
    const meta = zone.querySelector('.drop-zone__meta');
    status.textContent = '';

    // Raw pixel values, without colour management, so the numbers reflect the files themselves.
    createImageBitmap(file, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' }).then(function (bitmap) {
      slots[slot] = { name: file.name, width: bitmap.width, height: bitmap.height, pixels: readPixels(bitmap) };
      bitmap.close();
      if (preview.src) {
        URL.revokeObjectURL(preview.src);
      }
      preview.src = URL.createObjectURL(file);
      preview.hidden = false;
      zone.classList.add('has-image');
      meta.textContent = file.name + ' · ' + slots[slot].width + '×' + slots[slot].height;
      updateButton();
    }).catch(function () {
      slots[slot] = null;
      status.textContent = 'Could not decode ' + file.name + '.';
      updateButton();
    });
  }

  document.querySelectorAll('.drop-zone').forEach(function (zone) {
    const input = zone.querySelector('.drop-zone__input');
    input.addEventListener('change', function () {
      loadFile(zone, input.files[0]);
      input.value = '';
    });
    zone.addEventListener('dragover', function (event) {
      event.preventDefault();
      zone.classList.add('is-dragover');
    });
    zone.addEventListener('dragleave', function () {
      zone.classList.remove('is-dragover');
    });
    zone.addEventListener('drop', function (event) {
      event.preventDefault();
      zone.classList.remove('is-dragover');
      loadFile(zone, event.dataTransfer.files[0]);
    });
  });

  // A drop that misses the zones would otherwise navigate away to the image.
  window.addEventListener('dragover', function (event) {
    event.preventDefault();
  });
  window.addEventListener('drop', function (event) {
    event.preventDefault();
  });

  calcButton.addEventListener('click', function () {
    const a = slots[0];
    const b = slots[1];
    if (a.width !== b.width || a.height !== b.height) {
      status.textContent = 'Image sizes differ: ' + a.width + '×' + a.height + ' vs ' + b.width + '×' + b.height + '.';
      return;
    }
    if (a.width < WIN || a.height < WIN) {
      status.textContent = 'Images must be at least ' + WIN + '×' + WIN + ' pixels.';
      return;
    }

    calcButton.disabled = true;
    status.textContent = 'Calculating…';

    // Let the status paint before the synchronous work blocks the thread.
    window.requestAnimationFrame(function () {
      window.setTimeout(function () {
        const res = compare(a.pixels, b.pixels, a.width, a.height);
        document.querySelector('[data-score="psnr"]').textContent =
          res.psnr === Infinity ? '∞ dB' : res.psnr.toFixed(2) + ' dB';
        document.querySelector('[data-score="ssim"]').textContent = res.ssim.toFixed(4);
        drawHeatMap(document.querySelector('[data-map="ssim"]'), res.dissim, a.width, a.height);
        drawHeatMap(document.querySelector('[data-map="err"]'), res.err, a.width, a.height);
        results.hidden = false;
        status.textContent = '';
        updateButton();
      }, 0);
    });
  });

  document.querySelectorAll('.heat-map__save').forEach(function (button) {
    button.addEventListener('click', function () {
      const key = button.dataset.save;
      const canvas = document.querySelector('[data-map="' + key + '"]');
      canvas.toBlob(function (blob) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = (key === 'ssim' ? 'ssim-diff' : 'abs-error') + '.png';
        link.click();
        window.setTimeout(function () {
          URL.revokeObjectURL(link.href);
        }, 1000);
      }, 'image/png');
    });
  });
})();
