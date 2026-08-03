/**
 * Single source of truth for every publication on this site.
 *
 * Both the full list on publications.html and the "Recent Publications"
 * block on index.html are rendered from this array by js/publications.js.
 * Adding a paper = adding one object at the top of PUBLICATIONS: year
 * headings, cards, BibTeX dialogs and the homepage highlights are all
 * derived from this data.
 *
 * The one follow-up step is `python tools/optimize-images.py`, which builds
 * the web-sized copy of each teaser under images/thumbs/. The card falls back
 * to the full-size figure named here until that runs, so a new paper looks
 * right either way — it just costs the visitor a megabyte or two.
 *
 * Fields
 *   id        unique slug, used for anchors (#pub-<id>)
 *   title     paper title (plain text)
 *   authors   array of author names, in order. Names matching ME are bolded.
 *   venue     where it appeared
 *   note      optional qualifier shown after the venue, e.g. "to appear"
 *   year      number, used to group the list
 *   teasers   array of image paths (thumbnails)
 *   links     optional { pdf, supplemental, code, arxiv, doi, project }
 *   bibtex    citation string, written with String.raw so LaTeX escapes
 *             such as \" and \& survive verbatim
 */

/* Author name to highlight throughout the list. */
const ME = 'A. Sahistan';

/* How many of the most recent papers index.html shows. */
const RECENT_PUBLICATION_COUNT = 3;

const PUBLICATIONS = [
  {
    id: 'vis-inr-2026',
    title: 'A Query-Efficient Stochastic Volume Rendering Framework for Time-Varying Implicit Neural Volumes',
    authors: ['A. Sahistan', 'H. Miao', 'Z. Li', 'T. Bremer', 'J. Levine', 'V. Pascucci'],
    venue: 'IEEE Visualization Conference',
    year: 2026,
    note: 'to appear',
    teasers: ['images/quesvr/t1.png', 'images/quesvr/t2.gif'],
    links: {
      pdf: 'research/quesvr.pdf',
      code: 'https://github.com/alpers-git/VIZ-INR'
    },
    bibtex: String.raw`@inproceedings{Sahistan2026VizINR,
            author={Sahistan, Alper and Miao, Haichao and Li, Zhimin and Bremer, Peer-Timo and Levine, Joshua A. and Pascucci, Valerio},
            booktitle={2026 IEEE Visualization Conference (to appear)}, 
            title={A Query-Efficient Stochastic Volume Rendering Framework for Time-Varying Implicit Neural Volumes}, 
            year={2026},
            doi={TBD}}`
  },
  {
    id: 'rafi-2026',
    title: 'RAFI — A Ray/Work Forwarding Infrastructure for Data Parallel Multi-Node/Multi-GPU Computing',
    authors: ['I. Wald', 'S. Demirci', 'A. Sahistan', 'S. Zellmann', 'A. Paris', 'P. Moran',
      'M. Jaros', 'T. von Landesberger', 'U. Gudukbay', 'V. Pascucci'],
    venue: 'arXiv preprint',
    year: 2026,
    teasers: ['images/rafi/t1.png', 'images/rafi/t2.png', 'images/rafi/t3.png'],
    links: {
      pdf: 'research/rafi.pdf',
      arxiv: 'https://arxiv.org/abs/2605.30294'
    },
    bibtex: String.raw`@misc{wald2026rafirayworkforwarding,
  title={RAFI -- A Ray/Work Forwarding Infrastructure for Data Parallel Multi-Node/Multi-GPU Computing},
  author={Ingo Wald and Serkan Demirci and Alper Sahistan and Stefan Zellmann and Andrea Paris and Patrick Moran and Milan Jaros and Tatiana von Landesberger and Ugur Gudukbay and Valerio Pascucci},
  year={2026},
  eprint={2605.30294},
  archivePrefix={arXiv},
  primaryClass={cs.DC},
  url={https://arxiv.org/abs/2605.30294}}`
  },
  {
    id: 'mat-mdwt-2026',
    title: 'Materializing Inter-Channel Relationships with Multi-Density Woodcock Tracking',
    authors: ['A. Sahistan', 'S. Zellmann', 'H. Miao', 'N. Morrical', 'I. Wald', 'V. Pascucci'],
    venue: 'IEEE Transactions on Visualization and Computer Graphics',
    year: 2026,
    teasers: ['images/mdwt/t1.png', 'images/mdwt/t2.png', 'images/mdwt/t5.png'],
    links: {
      pdf: 'research/authorsMDWT.pdf',
      code: 'https://github.com/alpers-git/MDWTracker'
    },
    bibtex: String.raw`@article{Sahistan2026MatMDWT,
  author = {Sahistan, Alper and Zellmann, Stefan and Miao, Haichao and Morrical, Nate and Wald, Ingo and Pascucci, Valerio},
  journal = {IEEE Transactions on Visualization and Computer Graphics},
  title = {Materializing Inter-Channel Relationships with Multi-Density Woodcock Tracking},
  year = {2026},
  doi = {10.1109/TVCG.2026.3653310},
  volume = {},
  number = {}}`
  },
  {
    id: 'fair-petascale-2026',
    title: 'Expanding Access to Science Participation: A FAIR Framework for Petascale Data Visualization and Analytics',
    authors: ['A. Panta', 'A. Sahistan', 'X. Huang', 'A. A. Gooch', 'G. Scorzelli', 'H. Torres',
      'P. Klein', 'G. A. Ovando-Montejo', 'P. Lindstrom', 'V. Pascucci'],
    venue: 'IEEE Transactions on Visualization and Computer Graphics',
    year: 2026,
    teasers: ['images/FAIR_framework/t1.png'],
    links: {
      pdf: 'research/TVCG_Web_Based_Vis.pdf'
    },
    bibtex: String.raw`@article{Panta2026FAIRPetascale,
  author = {Panta, Aashish and Sahistan, Alper and Huang, Xuan and Gooch, Amy A. and Scorzelli, Giorgio and Torres, Hector and Klein, Patrice and Ovando-Montejo, Gustavo A. and Lindstrom, Peter and Pascucci, Valerio},
  journal = {IEEE Transactions on Visualization and Computer Graphics (to appear)},
  title = {Expanding Access to Science Participation: A FAIR Framework for Petascale Data Visualization and Analytics},
  year = {2026},
  volume = {},
  number = {}}`
  },
  {
    id: 'mdwt-2025',
    title: 'Multi-Density Woodcock Tracking: Efficient & High-Quality Rendering for Multi-Channel Volumes',
    authors: ['A. Sahistan', 'S. Zellmann', 'N. Morrical', 'V. Pascucci', 'I. Wald'],
    venue: 'Eurographics Symposium on Parallel Graphics and Visualization',
    year: 2025,
    teasers: ['images/mdwt/t1.png', 'images/mdwt/t2.png', 'images/mdwt/t3.png', 'images/mdwt/t4.png'],
    links: {
      pdf: 'research/multi-densityWT.pdf',
      supplemental: 'research/multi-densityWTsup.pdf',
      code: 'https://github.com/alpers-git/MDWTracker'
    },
    bibtex: String.raw`@inproceedings{sahistan2025MDWT,
  booktitle = {Eurographics Symposium on Parallel Graphics and Visualization},
  title = {{Multi-Density Woodcock Tracking: Efficient \& High-Quality Rendering for Multi-Channel Volumes}},
  author = {Sahistan, Alper and Zellmann, Stefan and Morrical, Nate and Pascucci, Valerio and Wald, Ingo},
  year = {2025},
  publisher = {The Eurographics Association},
  DOI = {10.2312/pgv.20251150}}`
  },
  {
    id: 'beyond-exabricks-2024',
    title: 'Beyond ExaBricks: GPU Volume Path Tracing of AMR Data',
    authors: ['S. Zellmann', 'Q. Wu', 'A. Sahistan', 'K.-L. Ma', 'I. Wald'],
    venue: 'EuroVis 2024',
    year: 2024,
    teasers: ['images/beyond/t1.png'],
    links: {
      pdf: 'research/beyondExa.pdf'
    },
    bibtex: String.raw`@article{Zellmann2024Beyond,
  author = {Zellmann, Stefan and Wu, Qi and Sahistan, Alper and Ma, Kwan-Liu and Wald, Ingo},
  title = {Beyond ExaBricks: GPU Volume Path Tracing of AMR Data},
  journal = {Computer Graphics Forum},
  volume = {43},
  number = {3},
  doi = {https://doi.org/10.1111/cgf.15095},
  year = {2024}}`
  },
  {
    id: 'nontrivial-partitions-2024',
    title: 'Visualization of Large Non-Trivially Partitioned Unstructured Data with Native Distribution on High-Performance Computing Systems',
    authors: ['A. Sahistan', 'S. Demirci', 'I. Wald', 'S. Zellmann', 'J. Barbosa', 'N. Morrical', 'U. Gudukbay'],
    venue: 'IEEE Transactions on Visualization and Computer Graphics',
    year: 2024,
    teasers: [
      'images/Visualization_Large_Nontrivially/t1.png',
      'images/Visualization_Large_Nontrivially/t2.png',
      'images/Visualization_Large_Nontrivially/t3.png',
      'images/Visualization_Large_Nontrivially/t4.png'
    ],
    links: {
      pdf: 'research/Visualization_Large_Nontrivially.pdf',
      code: 'https://github.com/ingowald/deepCompositing'
    },
    bibtex: String.raw`@article{Sahistan2024VisNonTrivialPart,
  author = {Sahistan, Alper and Demirci, Serkan and Wald, Ingo and Zellmann, Stefan and Barbosa, João and Morrical, Nate and G\"ud\"ukbay, U\^gur},
  journal = {IEEE Transactions on Visualization and Computer Graphics},
  title = {Visualization of Large Non-Trivially Partitioned Unstructured Data with Native Distribution on High-Performance Computing Systems},
  year = {2024},
  volume = {},
  number = {},
  pages = {1-14},
  doi = {10.1109/TVCG.2024.3427335}}`
  },
  {
    id: 'attribute-aware-rbfs-2023',
    title: 'Attribute-Aware RBFs: Interactive Visualization of Time Series Particle Volumes Using RT Core Range Queries',
    authors: ['N. Morrical', 'S. Zellmann', 'A. Sahistan', 'P. Shriwise', 'V. Pascucci'],
    venue: '2023 IEEE Visualization Conference (VIS)',
    year: 2023,
    teasers: ['images/rbfs/teaser.png', 'images/rbfs/t2.png'],
    links: {
      pdf: 'research/Attribute_Aware_RBFs.pdf'
    },
    bibtex: String.raw`@inproceedings{Morrical2023RBF,
  author = {Morrical, Nate and Zellmann, Stefan and Sahistan, Alper and Shriwise, Patrick and Pascucci, Valerio},
  booktitle = {2023 IEEE Visualization Conference (VIS)},
  title = {Attribute-Aware RBFs: Interactive Visualization of Time Series Particle Volumes Using RT Core Range Queries},
  year = {2023},
  volume = {},
  number = {},
  doi = {10.1109/TVCG.2023.3327366}}`
  },
  {
    id: 'island-parallelism-2022',
    title: 'Hybrid Image-/Data-Parallel Rendering Using Island Parallelism',
    authors: ['S. Zellmann', 'I. Wald', 'J. Barbosa', 'S. Demirci', 'A. Sahistan', 'U. Gudukbay'],
    venue: 'The 12th IEEE Symposium on Large Data Analysis and Visualization',
    year: 2022,
    teasers: ['images/islands/t1.png', 'images/islands/t2.png', 'images/islands/t3.png', 'images/islands/t4.png'],
    links: {
      pdf: 'research/islands-paper-compressed.pdf'
    },
    bibtex: String.raw`@inproceedings{Zellmann2022Islands,
  year = {2022},
  month = {oct},
  title = {Hybrid Image-/Data-Parallel Rendering Using Island Parallelism},
  booktitle = {The 12th IEEE Symposium on Large Data Analysis and Visualization},
  author = {Zellmann, Stefan and Wald, Ingo and Barbosa, Joao and Demirci, Serkan and Sahistan, Alper and G\"ud\"ukbay, U\^gur}}`
  },
  {
    id: 'quick-clusters-2022',
    title: 'Quick Clusters: A GPU-Parallel Partitioning for Efficient Path Tracing of Unstructured Volumetric Grids',
    authors: ['N. Morrical', 'A. Sahistan', 'U. Gudukbay', 'I. Wald', 'V. Pascucci'],
    venue: '2022 IEEE Visualization Conference (VIS)',
    year: 2022,
    teasers: ['images/quick_clusters/t2.jpg', 'images/quick_clusters/t3.png'],
    links: {
      pdf: 'research/quick-clusters.pdf'
    },
    bibtex: String.raw`@inproceedings{Morrical2022QuickClusters,
  year = {2022},
  month = {oct},
  title = {Quick Clusters: A GPU-Parallel Partitioning for Efficient Path Tracing of Unstructured Volumetric Grids},
  booktitle = {2022 IEEE Visualization Conference (VIS)},
  author = {Morrical, Nate and Sahistan, Alper and G\"ud\"ukbay, U\^gur and Wald, Ingo and Pascucci, Valerio}}`
  },
  {
    id: 'gpu-streaming-amr-2022',
    title: 'Design and Evaluation of a GPU Streaming Framework for Visualizing Time-Varying AMR Data',
    authors: ['S. Zellmann', 'I. Wald', 'A. Sahistan', 'M. Hellmann', 'W. Usher'],
    venue: 'Eurographics Symposium on Parallel Graphics and Visualization',
    year: 2022,
    teasers: ['images/gpu_streaming/t1.png'],
    links: {
      pdf: 'research/paper-exajet-animated-compressed.pdf'
    },
    bibtex: String.raw`@inproceedings{Zellmann2022AMRAnimated,
  year = {2022},
  month = {jun},
  author = {Zellmann, Stefan and Wald, Ingo and Sahistan, Alper and Hellmann, Matthias and Usher, Will},
  title = {Design and Evaluation of a {GPU} Streaming Framework for Visualizing Time-Varying {AMR} Data},
  editor = {Bujack, R. and Tierny, J. and Sadlo, F.},
  booktitle = {Eurographics Symposium on Parallel Graphics and Visualization}}`
  },
  {
    id: 'shell-traversal-2021',
    title: 'Ray-traced Shell Traversal of Tetrahedral Meshes for Direct Volume Visualization',
    authors: ['A. Sahistan', 'S. Demirci', 'N. Morrical', 'S. Zellmann', 'A. Aman', 'I. Wald', 'U. Gudukbay'],
    venue: '2021 IEEE Visualization Conference (VIS) Short Papers',
    year: 2021,
    teasers: [
      'images/raytraced_shell/t1.png',
      'images/raytraced_shell/t2.png',
      'images/raytraced_shell/t3.png',
      'images/raytraced_shell/t4.png'
    ],
    links: {
      pdf: 'research/tetMarch-preprint.pdf'
    },
    bibtex: String.raw`@inproceedings{Sahistan2021ShellToShell,
  doi = {10.1109/VIS49827.2021.9623298},
  year = {2021},
  month = {oct},
  title = {Ray-traced Shell Traversal of Tetrahedral Meshes for Direct Volume Visualization},
  booktitle = {2021 IEEE Visualization Conference (VIS) Short Papers},
  author = {Sahistan, Alper and Demirci, Serkan and Morrical, Nathan and Zellmann, Stefan and Aman, Aytek and Wald, Ingo and G\"ud\"ukbay, U\^gur}}`
  }
];
