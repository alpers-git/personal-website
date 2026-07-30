/**
 * Renders every publication view on the site from js/publications-data.js.
 *
 *   <div data-publications="all">     full list, grouped by year
 *   <div data-publications="recent">  the RECENT_PUBLICATION_COUNT newest
 *
 * A single BibTeX dialog is created once and refilled on demand, so papers
 * no longer need hand-numbered #modalN / #paperN pairs.
 */
(function () {
  'use strict';

  /* All icons come from one set (Iconify, already loaded for the nav) so they
     share a baseline and a single size. The row previously mixed Material Icons
     glyphs with an Iconify GitHub mark, which sat at a different optical size.

     `mdi:file-pdf-box` spells out PDF inside a document outline, so it reads as
     "this is a PDF" at 1rem far better than Material's `picture_as_pdf`, whose
     lettering blurs at small sizes. */
  const ICONS = {
    arrow: 'mdi:arrow-right',
    pdf: 'mdi:file-pdf-box',
    bibtex: 'mdi:format-quote-close',
    code: 'mdi:github',
    supplemental: 'mdi:file-document-outline',
    doi: 'mdi:link-variant',
    project: 'mdi:web',
    copy: 'mdi:content-copy'
  };

  const LABELS = {
    pdf: "Author's version (PDF)",
    supplemental: 'Supplemental material (PDF)',
    doi: 'Publisher page',
    project: 'Project page',
    code: 'Source code'
  };

  const SHORT_LABELS = {
    pdf: 'PDF',
    supplemental: 'Supplemental',
    doi: 'DOI',
    project: 'Project',
    code: 'Code'
  };

  function icon(kind) {
    return '<span class="iconify pub-action__icon" data-icon="' + ICONS[kind] +
      '" data-inline="false"></span>';
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderAuthors(authors) {
    return authors
      .map(function (name) {
        const safe = escapeHtml(name);
        return name === ME ? '<b>' + safe + '</b>' : safe;
      })
      .join(', ');
  }

  function renderTeasers(pub) {
    if (!pub.teasers || pub.teasers.length === 0) {
      return '';
    }

    const images = pub.teasers
      .map(function (src, index) {
        // The first teaser carries the page's visual weight on narrow screens;
        // the rest are supporting detail and collapse away there.
        const modifier = index === 0 ? '' : ' pub-teaser--secondary';
        return '<img class="pub-teaser' + modifier + '" loading="lazy" src="' +
          escapeHtml(src) + '" alt="Teaser figure from &quot;' + escapeHtml(pub.title) + '&quot;">';
      })
      .join('');

    // The inner wrapper lets the compact layout take the row out of flow so the
    // images can be measured against the text column — see css/style.css.
    return '<div class="pub-card__media"><div class="pub-card__media-inner">' +
      images + '</div></div>';
  }

  function renderAction(kind, href, pub) {
    return '<a class="pub-action" href="' + escapeHtml(href) + '" target="_blank" rel="noopener noreferrer" ' +
      'title="' + LABELS[kind] + '" aria-label="' + LABELS[kind] + ' for ' + escapeHtml(pub.title) + '">' +
      icon(kind) +
      '<span class="pub-action__label">' + SHORT_LABELS[kind] + '</span></a>';
  }

  function renderActions(pub) {
    const links = pub.links || {};
    const parts = [];

    if (links.pdf) {
      parts.push(renderAction('pdf', links.pdf, pub));
    }

    parts.push(
      '<button type="button" class="pub-action pub-action--bibtex" data-bibtex-for="' + escapeHtml(pub.id) + '" ' +
      'aria-label="Show BibTeX citation for ' + escapeHtml(pub.title) + '">' +
      icon('bibtex') +
      '<span class="pub-action__label">BibTeX</span></button>'
    );

    ['code', 'supplemental', 'doi', 'project'].forEach(function (kind) {
      if (links[kind]) {
        parts.push(renderAction(kind, links[kind], pub));
      }
    });

    return '<div class="pub-card__actions">' + parts.join('') + '</div>';
  }

  /* The year gets its own slot on the venue line, so a venue that already spells
     it out ("EuroVis 2024", "2023 IEEE Visualization Conference (VIS)") would
     print it twice. Strip it there and let the slot carry it, so every card
     states the year in the same place regardless of how the venue is written. */
  function venueWithoutYear(pub) {
    const year = String(pub.year);

    return pub.venue
      .replace(new RegExp('^' + year + '\\s+'), '')
      .replace(new RegExp('[,\\s]+' + year + '(?![0-9])'), ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function renderCard(pub, variant) {
    const note = pub.note ? ' <span class="pub-card__note">(' + escapeHtml(pub.note) + ')</span>' : '';
    const modifier = variant === 'compact' ? ' pub-card--compact' : '';

    return '<article class="pub-card' + modifier + '" id="pub-' + escapeHtml(pub.id) + '">' +
      renderTeasers(pub) +
      '<div class="pub-card__body">' +
        '<h3 class="pub-card__title">' + escapeHtml(pub.title) + '</h3>' +
        '<p class="pub-card__venue"><em>' + escapeHtml(venueWithoutYear(pub)) + '</em>' + note +
          '<span class="pub-card__year">' + pub.year + '</span></p>' +
        '<p class="pub-card__authors">' + renderAuthors(pub.authors) + '</p>' +
      '</div>' +
      renderActions(pub) +
    '</article>';
  }

  function byYearDescending(a, b) {
    return b.year - a.year;
  }

  function groupByYear(publications) {
    const years = [];
    const buckets = {};

    publications.forEach(function (pub) {
      if (!buckets[pub.year]) {
        buckets[pub.year] = [];
        years.push(pub.year);
      }
      buckets[pub.year].push(pub);
    });

    return years.sort(function (a, b) { return b - a; }).map(function (year) {
      return { year: year, items: buckets[year] };
    });
  }

  function renderFullList(container, publications) {
    container.innerHTML = groupByYear(publications)
      .map(function (group) {
        return '<section class="pub-year" id="year-' + group.year + '">' +
          '<h2 class="pub-year__heading">' + group.year + '</h2>' +
          group.items.map(function (pub) { return renderCard(pub, 'full'); }).join('') +
        '</section>';
      })
      .join('');
  }

  /* ---- year navigation ------------------------------------------------- */

  /* All years are shown inline as a single rail, on every screen size.

     This replaced a "Go to year" dropdown: hiding six four-character numbers
     behind a hover menu cost a click, gave touch users the wrong affordance, and
     needed open/close/outside-click/Escape handling to work at all. Laid out
     flat the whole set is readable at a glance, the markup is one row of links,
     and the only behaviour left is highlighting whichever year is on screen. */
  function renderYearNav(container, publications) {
    const groups = groupByYear(publications);

    if (groups.length === 0) {
      return;
    }

    container.innerHTML =
      '<div class="year-nav__inner">' +
        '<span class="year-nav__label">Jump to</span>' +
        '<div class="year-nav__list">' +
          groups.map(function (group) {
            return '<a class="year-nav__year" href="#year-' + group.year + '">' + group.year + '</a>';
          }).join('') +
        '</div>' +
      '</div>';

    highlightCurrentYear(container, groups);
  }

  /* Marks the year whose section is currently in view. */
  function highlightCurrentYear(container, groups) {
    const links = {};

    groups.forEach(function (group) {
      links[group.year] = container.querySelector('a[href="#year-' + group.year + '"]');
    });

    const sections = groups
      .map(function (group) {
        return { year: group.year, el: document.getElementById('year-' + group.year) };
      })
      .filter(function (entry) { return entry.el; });

    if (sections.length === 0) {
      return;
    }

    let current = null;
    let queued = false;

    function update() {
      queued = false;

      const doc = document.documentElement;
      const atBottom = window.scrollY + window.innerHeight >= doc.scrollHeight - 2;
      let match;

      if (atBottom) {
        // The oldest year is the last and shortest section, and on a wide screen
        // the page runs out of scroll before its heading ever reaches the
        // reference line — so it could never be selected by the test below.
        // Reaching the bottom of the document *is* being at the last year.
        match = sections[sections.length - 1];
      } else {
        // Otherwise: the last section whose heading has passed under the rail.
        const line = window.scrollY + container.getBoundingClientRect().height + 96;

        match = sections[0];

        sections.forEach(function (entry) {
          if (entry.el.getBoundingClientRect().top + window.scrollY <= line) {
            match = entry;
          }
        });
      }

      if (match.year === current) {
        return;
      }

      if (current !== null && links[current]) {
        links[current].classList.remove('is-current');
      }

      current = match.year;

      if (links[current]) {
        links[current].classList.add('is-current');
        links[current].setAttribute('aria-current', 'true');
      }

      Object.keys(links).forEach(function (year) {
        if (Number(year) !== current && links[year]) {
          links[year].removeAttribute('aria-current');
        }
      });
    }

    function requestUpdate() {
      if (!queued) {
        queued = true;
        window.requestAnimationFrame(update);
      }
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    // Teaser images change the page height as they decode, which moves both the
    // section offsets and the bottom-of-document threshold.
    window.addEventListener('load', requestUpdate);
    update();
  }

  /* Outlined counterpart to a publication card, sitting at the head of the recent
     list. It leads the list rather than following it so it is reachable without
     scrolling past three tall cards, and it carries the total so a visitor can
     see at a glance that three is a preview and not the whole record.

     The counts come from the data, so they stay correct as papers are added. */
  function renderBrowseAll(total, shown) {
    // Material Symbols glyph, not Iconify: index.html subsets the font to this
    // one icon name, so adding another here needs that URL updated too.
    return '<a class="pub-browse-all" href="publications.html">' +
      '<span class="material-symbols-outlined pub-browse-all__icon" aria-hidden="true">book_5</span>' +
      '<span class="pub-browse-all__text">' +
        '<span class="pub-browse-all__title">All ' + total + ' publications</span>' +
        '<span class="pub-browse-all__hint">' + shown + ' most recent shown below</span>' +
      '</span>' +
      '<span class="iconify pub-browse-all__arrow" data-icon="' + ICONS.arrow + '" data-inline="false"></span>' +
    '</a>';
  }

  function renderRecentList(container, publications) {
    const count = typeof RECENT_PUBLICATION_COUNT === 'number' ? RECENT_PUBLICATION_COUNT : 3;
    const shown = Math.min(count, publications.length);

    container.innerHTML =
      renderBrowseAll(publications.length, shown) +
      publications
        .slice(0, count)
        .map(function (pub) { return renderCard(pub, 'compact'); })
        .join('');
  }

  /* ---- BibTeX dialog -------------------------------------------------- */

  function createBibtexDialog(publications) {
    const dialog = document.createElement('div');
    dialog.id = 'bibtex-modal';
    dialog.className = 'modal citation-box';
    dialog.innerHTML =
      '<div class="modal-content">' +
        '<h4 class="citation-box__heading">BibTeX citation</h4>' +
        '<pre class="citation-text" id="bibtex-modal-text"></pre>' +
        '<div class="citation-box__actions">' +
          '<button type="button" class="pub-action pub-action--copy" id="bibtex-modal-copy">' +
            icon('copy') +
            '<span class="pub-action__label">Copy</span>' +
          '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(dialog);

    const textNode = dialog.querySelector('#bibtex-modal-text');
    const copyButton = dialog.querySelector('#bibtex-modal-copy');
    const copyLabel = copyButton.querySelector('.pub-action__label');
    let instance = null;
    let resetTimer = null;

    if (window.M && M.Modal) {
      instance = M.Modal.init(dialog, {
        onCloseEnd: function () {
          resetCopyButton();
        }
      });
    }

    function resetCopyButton() {
      window.clearTimeout(resetTimer);
      copyButton.classList.remove('is-copied');
      copyLabel.textContent = 'Copy';
    }

    function flashCopyResult(message) {
      copyButton.classList.add('is-copied');
      copyLabel.textContent = message;
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(resetCopyButton, 1800);
    }

    function copyText(text) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
      }

      // Fallback for file:// and other non-secure contexts.
      return new Promise(function (resolve, reject) {
        const scratch = document.createElement('textarea');
        scratch.value = text;
        scratch.setAttribute('readonly', '');
        scratch.style.position = 'fixed';
        scratch.style.opacity = '0';
        document.body.appendChild(scratch);
        scratch.select();

        try {
          document.execCommand('copy') ? resolve() : reject(new Error('copy rejected'));
        } catch (error) {
          reject(error);
        } finally {
          document.body.removeChild(scratch);
        }
      });
    }

    copyButton.addEventListener('click', function () {
      copyText(textNode.textContent).then(
        function () { flashCopyResult('Copied'); },
        function () { flashCopyResult('Press Ctrl+C'); }
      );
    });

    document.addEventListener('click', function (event) {
      const trigger = event.target.closest('[data-bibtex-for]');
      if (!trigger) {
        return;
      }

      const pub = publications.find(function (candidate) {
        return candidate.id === trigger.getAttribute('data-bibtex-for');
      });

      if (!pub) {
        return;
      }

      resetCopyButton();
      textNode.textContent = pub.bibtex;

      if (instance) {
        instance.open();
      }
    });
  }

  /* ---- boot ------------------------------------------------------------ */

  function init() {
    if (typeof PUBLICATIONS === 'undefined') {
      return;
    }

    const publications = PUBLICATIONS.slice().sort(byYearDescending);
    const targets = document.querySelectorAll('[data-publications]');

    if (targets.length === 0) {
      return;
    }

    targets.forEach(function (container) {
      if (container.getAttribute('data-publications') === 'recent') {
        renderRecentList(container, publications);
      } else {
        renderFullList(container, publications);
      }
    });

    document.querySelectorAll('[data-publication-years]').forEach(function (container) {
      renderYearNav(container, publications);
    });

    createBibtexDialog(publications);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
