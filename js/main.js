/* Shared behaviour for every page: nav, smooth scrolling and hover previews. */

document.addEventListener('DOMContentLoaded', function () {
  const burger = document.querySelector('.nav-burger');

  function setBurgerState(open) {
    if (burger) {
      burger.classList.toggle('is-active', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
  }

  // Drawer opens from the right so it lines up with the button, which sits at
  // the right end of the bar and stays above the panel once it is open.
  const sidenavs = M.Sidenav.init(document.querySelectorAll('.sidenav'), {
    edge: 'right',
    inDuration: 320,
    outDuration: 240,
    onOpenStart: function (el) {
      el.classList.add('is-open');
      setBurgerState(true);
    },
    onCloseStart: function () {
      setBurgerState(false);
    },
    onCloseEnd: function (el) {
      // Removed only once the panel is gone, so the entries stay visible
      // while it slides out instead of blinking away first.
      el.classList.remove('is-open');
    }
  });

  // Materialize's own trigger handler only ever opens. Intercept in the
  // capture phase so a second tap on the X closes instead of doing nothing.
  if (burger && sidenavs.length > 0) {
    burger.addEventListener('click', function (event) {
      if (sidenavs[0].isOpen) {
        event.preventDefault();
        event.stopPropagation();
        sidenavs[0].close();
      }
    }, true);
  }

  M.Parallax.init(document.querySelectorAll('.parallax'), {});

  document.body.classList.add('page_loaded');
});

/* --------------------------------------------------------------------------
   Tap feedback for the amber nav controls.

   These sit at their accent colour at rest and must return to it afterwards, so
   a press cannot be expressed with :active (gone the moment you lift) or with a
   sticky state class (never returns). Instead the press adds .is-pressed and a
   timer removes it, giving a brief flash that always settles back to amber.
   -------------------------------------------------------------------------- */

(function () {
  const FLASH_MS = 320;
  const SELECTOR = '.nav-burger, .cornerName, .nav-social, .nav-fx-icon, .nav-social-toggle';

  document.querySelectorAll(SELECTOR).forEach(function (el) {
    let timer = null;

    // pointerdown so touch and mouse both flash immediately on contact.
    el.addEventListener('pointerdown', function () {
      el.classList.add('is-pressed');
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        el.classList.remove('is-pressed');
      }, FLASH_MS);
    });
  });
})();

/* --------------------------------------------------------------------------
   Social strip reveal (mobile widths only; above 992px CSS keeps it open).
   -------------------------------------------------------------------------- */

(function () {
  const toggle = document.querySelector('.nav-social-toggle');
  const strip = document.getElementById('nav-socials');

  if (!toggle || !strip) {
    return;
  }

  function setOpen(open) {
    strip.classList.toggle('is-open', open);
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Hide social links' : 'Show social links');
  }

  toggle.addEventListener('click', function (event) {
    event.preventDefault();
    setOpen(!strip.classList.contains('is-open'));
  });

  // Collapse again when attention moves elsewhere.
  document.addEventListener('click', function (event) {
    if (!strip.contains(event.target) && !toggle.contains(event.target)) {
      setOpen(false);
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      setOpen(false);
    }
  });
})();

/* --------------------------------------------------------------------------
   Smooth scrolling for in-page anchors.
   `#` and `#!` are placeholders (menu trigger, dead links) and must be skipped
   or querySelector throws on the invalid selector.
   -------------------------------------------------------------------------- */

document.addEventListener('click', function (event) {
  const link = event.target.closest('a[href^="#"]');

  if (!link) {
    return;
  }

  const href = link.getAttribute('href');

  if (href === '#' || href === '#!' || href.length < 2) {
    return;
  }

  const target = document.getElementById(href.slice(1));

  if (!target) {
    return;
  }

  event.preventDefault();
  target.scrollIntoView({ behavior: 'smooth' });
});

/* --------------------------------------------------------------------------
   Highlight the nav entry for whichever section is on screen.
   -------------------------------------------------------------------------- */

(function () {
  const sections = Array.prototype.slice.call(document.querySelectorAll('.anchor[id]'));

  if (sections.length === 0) {
    return;
  }

  const tabs = {
    about: document.getElementById('about-tab'),
    research: document.getElementById('research-tab'),
    'contact-footer': document.getElementById('contact-tab')
  };

  let activeId = null;
  let queued = false;

  function activate(id) {
    if (id === activeId) {
      return;
    }

    activeId = id;

    Object.keys(tabs).forEach(function (key) {
      if (tabs[key]) {
        tabs[key].classList.toggle('active', key === id);
      }
    });

    if (window.history.replaceState) {
      window.history.replaceState(null, '', '#' + id);
    }
  }

  function documentTop(element) {
    return element.getBoundingClientRect().top + window.scrollY;
  }

  function update() {
    queued = false;

    // The last section is the footer, which is too short to ever reach the
    // middle of the viewport — so bottom-of-page always means "contact".
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;

    if (atBottom) {
      activate(sections[sections.length - 1].id);
      return;
    }

    const line = window.scrollY + window.innerHeight * 0.4;
    let current = sections[0];

    sections.forEach(function (section) {
      if (documentTop(section) <= line) {
        current = section;
      }
    });

    activate(current.id);
  }

  function requestUpdate() {
    if (!queued) {
      queued = true;
      window.requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  window.addEventListener('load', requestUpdate);
  update();
})();

/* --------------------------------------------------------------------------
   Hover/focus image preview for project titles and inline terms.
   -------------------------------------------------------------------------- */

(function () {
  const triggers = document.querySelectorAll('[data-image]');

  if (triggers.length === 0) {
    return;
  }

  const panel = document.createElement('div');
  const image = document.createElement('img');
  const OFFSET = 18;
  const MARGIN = 12;

  panel.id = 'project-panel';
  panel.appendChild(image);
  document.body.appendChild(panel);

  function position(pageX, pageY) {
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const minLeft = window.scrollX + MARGIN;
    const minTop = window.scrollY + MARGIN;
    const maxLeft = window.scrollX + viewportWidth - panel.offsetWidth - MARGIN;
    const maxTop = window.scrollY + viewportHeight - panel.offsetHeight - MARGIN;

    panel.style.left = Math.max(minLeft, Math.min(pageX + OFFSET, maxLeft)) + 'px';
    panel.style.top = Math.max(minTop, Math.min(pageY + OFFSET, maxTop)) + 'px';
  }

  function show(trigger, pageX, pageY) {
    image.setAttribute('src', trigger.getAttribute('data-image'));
    image.setAttribute('alt', trigger.textContent.trim());
    panel.style.setProperty('--preview-width', (trigger.getAttribute('data-preview-width') || '200') + 'px');
    panel.style.display = 'block';
    position(pageX, pageY);
  }

  function hide() {
    panel.style.display = 'none';
    image.removeAttribute('src');
  }

  triggers.forEach(function (trigger) {
    trigger.addEventListener('mouseenter', function (event) {
      show(trigger, event.pageX, event.pageY);
    });

    trigger.addEventListener('mousemove', function (event) {
      position(event.pageX, event.pageY);
    });

    trigger.addEventListener('mouseleave', hide);

    trigger.addEventListener('focus', function () {
      const rect = trigger.getBoundingClientRect();
      show(trigger, window.scrollX + rect.right, window.scrollY + rect.bottom);
    });

    trigger.addEventListener('blur', hide);
  });
})();
