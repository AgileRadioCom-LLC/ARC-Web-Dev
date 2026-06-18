/* ═══════════════════════════════════════════════════════════════════════════
   AgileRadioCom — main.js
   Handles all interactive behaviour:
     1. AOS (Animate On Scroll) initialisation
     2. Sticky navbar background on scroll
     3. Active nav-link highlight via IntersectionObserver
     4. Hamburger mobile menu toggle
     5. Mobile menu auto-close on link click
     6. Contact form client-side validation + submission feedback
     7. Hero image slideshow (index.html only)
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────────────────────────────────────
   1. AOS — ANIMATE ON SCROLL
   Initialise the AOS library (loaded via CDN before this script).
   Elements with data-aos="..." attributes animate as they enter the viewport.
────────────────────────────────────────────────────────────────────────────*/
document.addEventListener('DOMContentLoaded', () => {
  AOS.init({
    duration: 650,        /* animation duration in ms */
    once: true,           /* only animate once (not on scroll-back) */
    offset: 60,           /* px from viewport edge to trigger */
    easing: 'ease-out-cubic',
  });


  /* ────────────────────────────────────────────────────────────────────────
     2. STICKY NAVBAR
     Adds .nav-scrolled to #navbar when the page scrolls past 50 px.
     CSS in style.css applies frosted-glass backdrop when that class is present.
  ──────────────────────────────────────────────────────────────────────────*/
  const navbar = document.getElementById('navbar');

  function handleNavbarScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('nav-scrolled');
    } else {
      navbar.classList.remove('nav-scrolled');
    }
  }

  /* Throttle the scroll handler to ~60 fps using requestAnimationFrame */
  let navbarTicking = false;
  window.addEventListener('scroll', () => {
    if (!navbarTicking) {
      globalThis.requestAnimationFrame(() => {
        handleNavbarScroll();
        navbarTicking = false;
      });
      navbarTicking = true;
    }
  }, { passive: true });

  /* Run once on load in case the page starts scrolled (e.g. anchor link) */
  handleNavbarScroll();


  /* ────────────────────────────────────────────────────────────────────────
     3. ACTIVE NAV LINK HIGHLIGHT
     Marks the nav link whose href matches the current page path.
  ──────────────────────────────────────────────────────────────────────────*/
  const navLinks    = document.querySelectorAll('.nav-link');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');
  const currentPath = globalThis.location.pathname;

  function applyActiveLinks(links) {
    links.forEach(link => {
      const href = link.getAttribute('href');
      const active = href === '/' ? currentPath === '/' : currentPath.startsWith(href);
      link.classList.toggle('active', active);
    });
  }

  applyActiveLinks(navLinks);
  applyActiveLinks(mobileLinks);


  /* ────────────────────────────────────────────────────────────────────────
     4. HAMBURGER MOBILE MENU TOGGLE
     Clicking #hamburger expands/collapses #mobile-menu by animating
     max-height (CSS transition cannot animate height:auto, so we set a
     large max-height value when open and 0 when closed).
  ──────────────────────────────────────────────────────────────────────────*/
  const hamburger   = document.getElementById('hamburger');
  const mobileMenu  = document.getElementById('mobile-menu');

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';

    if (isOpen) {
      /* Close: collapse max-height back to 0 */
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      mobileMenu.style.maxHeight = '0';
    } else {
      /* Open: expand to scrollHeight so the full menu fits */
      hamburger.setAttribute('aria-expanded', 'true');
      mobileMenu.setAttribute('aria-hidden', 'false');
      mobileMenu.style.maxHeight = mobileMenu.scrollHeight + 'px';
    }
  });


  /* ────────────────────────────────────────────────────────────────────────
     5. AUTO-CLOSE MOBILE MENU ON LINK CLICK
     When a mobile nav link is tapped the menu should close so the user
     can see the target section without the menu blocking it.
  ──────────────────────────────────────────────────────────────────────────*/
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      mobileMenu.style.maxHeight = '0';
    });
  });

  /* Also close if the user clicks anywhere outside the menu */
  document.addEventListener('click', (e) => {
    if (
      hamburger.getAttribute('aria-expanded') === 'true' &&
      !mobileMenu.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      mobileMenu.style.maxHeight = '0';
    }
  });


  /* ────────────────────────────────────────────────────────────────────────
     6. CONTACT FORM — VALIDATION, DOMAIN CHECK & FORMSPREE SUBMISSION
  ──────────────────────────────────────────────────────────────────────────*/
  const contactForm       = document.getElementById('contact-form');
  const formStatus        = document.getElementById('form-status');
  const emailInput        = document.getElementById('email');
  const emailDomainStatus = document.getElementById('email-domain-status');

  const SEND_ICON = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>`;

  /* ── DNS-over-HTTPS domain check ──
     Queries Google's public DNS API for MX records on the email domain.
     Falls back to checking an A record in case MX is missing but the
     domain is valid. Returns true (allow) if the network request itself
     fails, so a bad connection never blocks a real user. */
  async function validateEmailDomain(email) {
    const parts = email.split('@');
    if (parts.length !== 2 || !parts[1].includes('.')) return false;
    const domain = encodeURIComponent(parts[1].toLowerCase());
    try {
      const mxRes  = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`, { headers: { Accept: 'application/dns-json' } });
      const mxData = await mxRes.json();
      if (mxData.Status === 0 && Array.isArray(mxData.Answer) && mxData.Answer.length > 0) return true;

      /* No MX records — check A record as fallback (some domains skip MX) */
      const aRes  = await fetch(`https://dns.google/resolve?name=${domain}&type=A`, { headers: { Accept: 'application/dns-json' } });
      const aData = await aRes.json();
      return aData.Status === 0 && Array.isArray(aData.Answer) && aData.Answer.length > 0;
    } catch (e) {
      console.warn('DNS domain check failed — allowing submission:', e);
      return true; /* network failure → be lenient, don't block the user */
    }
  }

  /* ── Real-time domain indicator on the email field ── */
  let domainCheckTimer = null;
  const emailPattern   = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setDomainStatus(cls, text) {
    if (!emailDomainStatus) return;
    emailDomainStatus.className = cls;
    emailDomainStatus.textContent = text;
  }

  if (emailInput) {
    emailInput.addEventListener('blur', () => {
      const val = emailInput.value.trim();
      if (!val || !emailPattern.test(val)) { setDomainStatus('', ''); return; }

      setDomainStatus('domain-wait', '⏳ Checking email domain…');
      clearTimeout(domainCheckTimer);
      domainCheckTimer = setTimeout(async () => {
        const ok = await validateEmailDomain(val);
        if (emailInput.value.trim() !== val) return; /* user changed field while waiting */
        if (ok) {
          setDomainStatus('domain-ok', '✓ Email domain looks good');
        } else {
          setDomainStatus('domain-fail', `✗ "${val.split('@')[1]}" doesn't appear to accept email`);
        }
      }, 600);
    });

    /* Clear indicator when user starts editing again */
    emailInput.addEventListener('input', () => {
      clearTimeout(domainCheckTimer);
      setDomainStatus('', '');
    });
  }

  /* ── Submit handler ── */
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const firstName = contactForm.querySelector('#first-name').value.trim();
      const lastName  = contactForm.querySelector('#last-name').value.trim();
      const email     = contactForm.querySelector('#email').value.trim();
      const company   = contactForm.querySelector('#company').value.trim();
      const subject   = contactForm.querySelector('#subject').value.trim();
      const message   = contactForm.querySelector('#message').value.trim();
      const submitBtn = contactForm.querySelector('button[type="submit"]');

      /* Basic field checks */
      if (!firstName || !lastName) { showFormStatus('error', 'Please enter your first and last name.'); return; }
      if (!email || !emailPattern.test(email)) { showFormStatus('error', 'Please enter a valid email address.'); return; }
      if (!subject) { showFormStatus('error', 'Please enter a subject for your message.'); return; }
      if (!message || message.length < 10) { showFormStatus('error', 'Please enter a message (at least 10 characters).'); return; }

      /* Domain validation */
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying email…';
      showFormStatus('info', '⏳ Verifying your email domain…');

      const domainOk = await validateEmailDomain(email);
      if (!domainOk) {
        showFormStatus('error', `"${email.split('@')[1]}" doesn't appear to accept emails. Please double-check your address.`);
        setDomainStatus('domain-fail', `✗ "${email.split('@')[1]}" doesn't appear to accept email`);
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send Message ' + SEND_ICON;
        return;
      }

      /* Send to PHP mail handler */
      submitBtn.textContent = 'Sending…';
      showFormStatus('info', '📨 Sending your message…');

      try {
        const res    = await fetch('/contact.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName, lastName, email, company, subject, message }),
        });
        const result = await res.json();

        if (res.ok && result.success) {
          showFormStatus('success', `✓ Message sent! We'll be in touch at ${email} shortly.`);
          setDomainStatus('', '');
          contactForm.reset();
        } else {
          const errMsg = result.error || 'Submission failed.';
          showFormStatus('error', errMsg + ' — or email us directly at agileradiocom@gmail.com');
        }
      } catch (err) {
        console.error('Contact form submission error:', err);
        showFormStatus('error', 'Network error sending your message. Please email us at agileradiocom@gmail.com');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send Message ' + SEND_ICON;
      }
    });
  }

  /* Helper: show the status bar below the form */
  function showFormStatus(type, msg) {
    if (!formStatus) return;
    formStatus.className = 'status-' + type;
    formStatus.textContent = msg;
    formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (type === 'success') {
      setTimeout(() => { formStatus.className = 'hidden'; formStatus.textContent = ''; }, 8000);
    }
  }


  /* ────────────────────────────────────────────────────────────────────────
     BONUS: SMOOTH HERO SCROLL INDICATOR FADE
     The "Scroll ↓" indicator below the hero CTA fades out as soon as
     the user starts scrolling, so it doesn't distract on subsequent visits.
  ──────────────────────────────────────────────────────────────────────────*/
  const scrollIndicator = document.querySelector('#hero .mt-20');
  if (scrollIndicator) {
    window.addEventListener('scroll', () => {
      const opacity = Math.max(0, 1 - window.scrollY / 200);
      scrollIndicator.style.opacity = opacity;
    }, { passive: true });
  }

  /* ────────────────────────────────────────────────────────────────────────
     7. GALLERY SLIDESHOW (index.html only)
     Cycles .gallery-slide <img> elements by toggling .active.
     CSS handles the opacity crossfade. Dot buttons update in sync.
     Interval: 5 000 ms per slide.
  ──────────────────────────────────────────────────────────────────────────*/
  const galleryEl = document.getElementById('gallery-slideshow');
  if (galleryEl) {
    const slides  = Array.from(galleryEl.querySelectorAll('.gallery-slide'));
    const dots    = Array.from(document.querySelectorAll('.gallery-dot'));
    const prevBtn = document.getElementById('gallery-prev');
    const nextBtn = document.getElementById('gallery-next');

    if (slides.length > 1) {
      let current = 0;
      let autoTimer;

      function goToSlide(index) {
        slides[current].classList.remove('active');
        if (dots[current]) dots[current].classList.remove('active');
        /* wrap negatives: ((n % len) + len) % len */
        current = ((index % slides.length) + slides.length) % slides.length;
        slides[current].classList.add('active');
        if (dots[current]) dots[current].classList.add('active');
      }

      /* Restart auto-timer so manual navigation doesn't immediately jump */
      function resetTimer() {
        clearInterval(autoTimer);
        autoTimer = setInterval(() => goToSlide(current + 1), 5000);
      }

      /* Dot clicks */
      dots.forEach((dot, i) => dot.addEventListener('click', () => { goToSlide(i); resetTimer(); }));

      /* Arrow clicks */
      if (prevBtn) prevBtn.addEventListener('click', () => { goToSlide(current - 1); resetTimer(); });
      if (nextBtn) nextBtn.addEventListener('click', () => { goToSlide(current + 1); resetTimer(); });

      /* Auto-advance every 5 seconds */
      autoTimer = setInterval(() => goToSlide(current + 1), 5000);
    }
  }

}); /* end DOMContentLoaded */
