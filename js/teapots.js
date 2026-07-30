/**
 * Slide-through gallery for the Utah teapot collection.
 *
 * Opened by any element carrying `data-teapot-gallery`. Photos and captions come
 * from js/teapots-data.js, so adding one is a single entry there.
 *
 * The photos are large (several megabytes each), so nothing is fetched until the
 * gallery is opened, and then only the current slide and its immediate
 * neighbours — otherwise landing on the home page would pull the whole set.
 */
(function () {
  'use strict';

  const SWIPE_THRESHOLD = 45;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function init() {
    const triggers = document.querySelectorAll('[data-teapot-gallery]');

    if (triggers.length === 0 || typeof TEAPOT_GALLERY === 'undefined' || TEAPOT_GALLERY.length === 0) {
      return;
    }

    const photos = TEAPOT_GALLERY;
    const overlay = document.createElement('div');

    overlay.className = 'lightbox';
    overlay.id = 'teapot-gallery';
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="lightbox__backdrop" data-close></div>' +
      '<div class="lightbox__dialog" role="dialog" aria-modal="true" aria-label="Utah teapot collection" tabindex="-1">' +
        '<button type="button" class="lightbox__close" data-close aria-label="Close gallery">' +
          '<i class="material-icons">close</i>' +
        '</button>' +
        '<div class="lightbox__viewport">' +
          '<div class="lightbox__track">' +
            photos.map(function (photo, index) {
              // src is withheld until the slide is needed; see preload().
              return '<figure class="lightbox__slide">' +
                '<img data-src="' + escapeHtml(photo.src) + '" alt="' +
                escapeHtml(photo.title || 'Utah teapot collection, photo ' + (index + 1)) + '">' +
              '</figure>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<button type="button" class="lightbox__nav lightbox__nav--prev" aria-label="Previous photo">' +
          '<i class="material-icons">chevron_left</i>' +
        '</button>' +
        '<button type="button" class="lightbox__nav lightbox__nav--next" aria-label="Next photo">' +
          '<i class="material-icons">chevron_right</i>' +
        '</button>' +
        '<div class="lightbox__caption">' +
          '<div class="lightbox__caption-text">' +
            '<p class="lightbox__title"></p>' +
            '<p class="lightbox__desc"></p>' +
          '</div>' +
          '<span class="lightbox__counter"></span>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    const dialog = overlay.querySelector('.lightbox__dialog');
    const track = overlay.querySelector('.lightbox__track');
    const slides = overlay.querySelectorAll('.lightbox__slide img');
    const titleNode = overlay.querySelector('.lightbox__title');
    const descNode = overlay.querySelector('.lightbox__desc');
    const counter = overlay.querySelector('.lightbox__counter');
    const prev = overlay.querySelector('.lightbox__nav--prev');
    const next = overlay.querySelector('.lightbox__nav--next');

    let index = 0;
    let lastFocused = null;

    /* Only the current slide and its neighbours are ever fetched. */
    function preload(target) {
      [target - 1, target, target + 1].forEach(function (i) {
        const img = slides[i];
        if (img && !img.getAttribute('src')) {
          img.setAttribute('src', img.getAttribute('data-src'));
        }
      });
    }

    function show(target) {
      index = Math.max(0, Math.min(target, photos.length - 1));

      track.style.transform = 'translateX(' + (index * -100) + '%)';
      preload(index);

      const photo = photos[index];

      titleNode.textContent = photo.title || '';
      titleNode.hidden = !photo.title;
      descNode.textContent = photo.description || '';
      descNode.hidden = !photo.description;
      counter.textContent = (index + 1) + ' / ' + photos.length;

      prev.disabled = index === 0;
      next.disabled = index === photos.length - 1;
    }

    function open(startAt) {
      lastFocused = document.activeElement;
      overlay.hidden = false;
      // Locks the page behind the overlay so a scroll gesture cannot move it.
      document.body.classList.add('has-lightbox');
      show(startAt || 0);
      dialog.focus();
    }

    function close() {
      overlay.hidden = true;
      document.body.classList.remove('has-lightbox');

      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function (event) {
        // Triggers are real links to the first photo, so they still do something
        // without JS; intercept only once the gallery is available.
        event.preventDefault();
        open(Number(trigger.getAttribute('data-teapot-gallery')) || 0);
      });
    });

    prev.addEventListener('click', function () { show(index - 1); });
    next.addEventListener('click', function () { show(index + 1); });

    overlay.addEventListener('click', function (event) {
      if (event.target.closest('[data-close]')) {
        close();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (overlay.hidden) {
        return;
      }

      if (event.key === 'Escape') {
        close();
      } else if (event.key === 'ArrowRight') {
        show(index + 1);
      } else if (event.key === 'ArrowLeft') {
        show(index - 1);
      }
    });

    /* Horizontal swipe on touch. */
    let touchStartX = null;
    let touchStartY = null;

    overlay.addEventListener('touchstart', function (event) {
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    }, { passive: true });

    overlay.addEventListener('touchend', function (event) {
      if (touchStartX === null) {
        return;
      }

      const dx = event.changedTouches[0].clientX - touchStartX;
      const dy = event.changedTouches[0].clientY - touchStartY;

      // Ignore mostly-vertical gestures so a scroll attempt does not page.
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        show(dx < 0 ? index + 1 : index - 1);
      }

      touchStartX = null;
      touchStartY = null;
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
