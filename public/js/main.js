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
      window.requestAnimationFrame(() => {
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
     Uses IntersectionObserver to watch each major section and marks the
     corresponding .nav-link as .active when that section is in view.
  ──────────────────────────────────────────────────────────────────────────*/
  const sections      = document.querySelectorAll('section[id]');
  const navLinks      = document.querySelectorAll('.nav-link');
  const mobileLinks   = document.querySelectorAll('.mobile-nav-link');

  function setActiveLink(id) {
    /* Remove active from all desktop and mobile links */
    navLinks.forEach(link => link.classList.remove('active'));
    mobileLinks.forEach(link => link.classList.remove('active'));

    /* Add active to matching links */
    navLinks.forEach(link => {
      if (link.getAttribute('href') === `#${id}`) link.classList.add('active');
    });
    mobileLinks.forEach(link => {
      if (link.getAttribute('href') === `#${id}`) link.classList.add('active');
    });
  }

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveLink(entry.target.id);
        }
      });
    },
    {
      rootMargin: '-30% 0px -60% 0px', /* trigger when section is ~30% into viewport */
      threshold: 0,
    }
  );

  sections.forEach(section => sectionObserver.observe(section));


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
     6. CONTACT FORM — VALIDATION & SUBMISSION FEEDBACK
     Validates required fields client-side, then shows a success or error
     message. Replace the TODO block with your actual backend / email
     service call (e.g. EmailJS, Formspree, Netlify Forms, etc.).
  ──────────────────────────────────────────────────────────────────────────*/
  const contactForm   = document.getElementById('contact-form');
  const formStatus    = document.getElementById('form-status');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault(); /* prevent default browser form submission */

      /* --- Client-side field validation --- */
      const firstName = contactForm.querySelector('#first-name').value.trim();
      const lastName  = contactForm.querySelector('#last-name').value.trim();
      const email     = contactForm.querySelector('#email').value.trim();
      const subject   = contactForm.querySelector('#subject').value.trim();
      const message   = contactForm.querySelector('#message').value.trim();

      /* Simple email format check */
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!firstName || !lastName) {
        showFormStatus('error', 'Please enter your first and last name.');
        return;
      }
      if (!email || !emailPattern.test(email)) {
        showFormStatus('error', 'Please enter a valid email address.');
        return;
      }
      if (!subject) {
        showFormStatus('error', 'Please enter a subject for your message.');
        return;
      }
      if (!message || message.length < 10) {
        showFormStatus('error', 'Please enter a message (at least 10 characters).');
        return;
      }

      /* --- Submission logic ---
         TODO: Replace this block with your real form backend.
         Options:
           • Formspree:  fetch('https://formspree.io/f/YOUR_ID', { method:'POST', ... })
           • EmailJS:    emailjs.send('serviceId', 'templateId', templateParams)
           • Netlify:    add data-netlify="true" to <form> tag (no JS needed)
           • Custom API: fetch('/api/contact', { method:'POST', body: JSON.stringify({...}) })
      */
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      try {
        /* ── DEMO DELAY (remove when wiring up a real backend) ── */
        await new Promise(resolve => setTimeout(resolve, 1200));

        /* ── SUCCESS ── */
        showFormStatus(
          'success',
          '✓ Message sent! Thank you for reaching out. We\'ll be in touch shortly.'
        );
        contactForm.reset();

      } catch (err) {
        /* ── ERROR ── */
        showFormStatus(
          'error',
          'Something went wrong sending your message. Please email us directly at agileradiocom@gmail.com'
        );
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          Send Message
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>`;
      }
    });
  }

  /* Helper: displays a status message below the form */
  function showFormStatus(type, message) {
    formStatus.className = ''; /* reset all classes */
    formStatus.classList.add(type === 'success' ? 'status-success' : 'status-error');
    formStatus.textContent = message;
    formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    /* Auto-hide success message after 8 seconds */
    if (type === 'success') {
      setTimeout(() => {
        formStatus.className = 'hidden';
        formStatus.textContent = '';
      }, 8000);
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
