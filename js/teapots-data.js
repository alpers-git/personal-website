/**
 * Photos for the Utah teapot collection gallery, in display order.
 *
 * Rendered by js/teapots.js into the slide-through lightbox opened from the
 * "Further Information" column on index.html.
 *
 * Fields
 *   src          path to the photo
 *   title        short label shown under the photo (optional)
 *   description  a sentence or two shown beneath the title (optional)
 *
 * Both caption fields are optional: an entry with neither still displays, it
 * just shows the photo and its position in the set.
 *
 * ---------------------------------------------------------------------------
 * TODO (Alper): the captions are left blank on purpose — I can't tell from the
 * filenames what each photo actually shows, and guessing would put wrong claims
 * on your own site. Fill in `title` and `description` per entry; anything you
 * leave empty simply renders without a caption.
 *
 * The one detail you mentioned — a teapot carrying twelve signatures from
 * pioneers of computer graphics — belongs on whichever photo shows it.
 * ---------------------------------------------------------------------------
 */

const TEAPOT_GALLERY = [
  {
    src: 'teapot_gallery/Anniversary_1.jpg',
    title: 'Signed 50th Anniversary Utah Teapot — 24th March 2023',
    description: 'Left-hand side of the teapot shows five of the twelve signatures from pioneers of computer graphics, including Ed Catmull, Henry Fuchs, Martin Newell, Ingo Wald, and Jim Blinn.'
  },
  {
    src: 'teapot_gallery/Anniversary_2.jpg',
    title: 'Signed 50th Anniversary Utah Teapot — 24th March 2023',
    description: 'Right-hand side of the teapot shows four of the twelve signatures from pioneers of computer graphics, including John Warnock, Ivan Sutherland, Steve Parker, and Henri Gouraud.'
  },
  {
    src: 'teapot_gallery/Anniversary_3.jpg',
    title: 'Signed 50th Anniversary Utah Teapot — 24th March 2023',
    description: 'Signatures under the lid of the teapot show two more University of Utah graphics legends from the modern era: Chris R. Johnson and Cem Yuksel.'
  },
  {
    src: 'teapot_gallery/Anniversary_4.jpg',
    title: 'Photos taken with some of the graphics legends at the celebration of the 50th anniversary of the U’s Kahlert School of Computing',
    description: 'Not everyone was available for a photo-op but I managed to get few shots with Ivan Sutherland, Steve Parker (along with my roommate Ben), Ed Catmull, and John Warnock.'
  },
  {
    src: 'teapot_gallery/RealtimeRenderingSum.jpg',
    title: 'Realtime Rendering Summit 2023 with Peter Shirley.',
    description: 'Obtained the twelveth and the last signature from the only person who can ray trace in one weekend on September 2023.'
  },
  {
    src: 'teapot_gallery/CHM.jpg',
    title: 'The original — the Computer History Museum in Mountain View, California.',
    description: 'Me paying respects to the original Utah teapot. Although we silently agreed my teapot is better.',
  },
  {
    src: 'teapot_gallery/Siggraph26UParty.jpg',
    title: 'SIGGRAPH 2026 University of Utah teapot party.',
    description: 'Years later in my first SIGGRAPH I met with Jim Blinn and Martin Newell again to get their signatures on the freshly obtained Coco-themed Renderman Walking Teapot. Special thanks to Cem Yuksel for organizing this event and also signing the walking teapot after this photo was taken.'},
  // {
  //   src: 'teapot_gallery/FinalGallery_1.jpg',
  //   title: '',
  //   description: ''
  // },
  // {
  //   src: 'teapot_gallery/FinalGallery_2.jpg',
  //   title: '',
  //   description: ''
  // },
  // {
  //   src: 'teapot_gallery/FinalGallery_3.jpg',
  //   title: '',
  //   description: ''
  // },
  {
    src: 'teapot_gallery/FinalGallery_4.jpg',
    title: 'The humble gallery of the Utah teapot memorabilia.',
    description: 'Call me selfish but I am keeping them as my personal collection.'
  },
];
