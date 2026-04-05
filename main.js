import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Lenis Smooth Scrolling
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutQuart
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);

  // 2. Custom Magnetic Cursor
  const cursorDot = document.querySelector(".cursor-dot");
  const cursorRing = document.querySelector(".cursor-ring");
  const magneticEls = document.querySelectorAll(".magnetic");

  // Only init cursor logic if not on a touch device
  if (window.matchMedia("(pointer: fine)").matches) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    // Fast dot tracking
    gsap.set(cursorDot, { xPercent: -50, yPercent: -50 });
    // Smooth ring tracking
    gsap.set(cursorRing, { xPercent: -50, yPercent: -50 });

    const xSetDot = gsap.quickSetter(cursorDot, "x", "px");
    const ySetDot = gsap.quickSetter(cursorDot, "y", "px");
    const xSetRing = gsap.quickSetter(cursorRing, "x", "px");
    const ySetRing = gsap.quickSetter(cursorRing, "y", "px");

    let ringX = mouseX;
    let ringY = mouseY;

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      xSetDot(mouseX);
      ySetDot(mouseY);
    });

    gsap.ticker.add(() => {
      // Lerp for ring
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      xSetRing(ringX);
      ySetRing(ringY);
    });

    // Magnetic Interactive Elements
    magneticEls.forEach((el) => {
      const strength = el.dataset.strength ? parseFloat(el.dataset.strength) : 20;

      el.addEventListener("mousemove", (e) => {
        document.body.classList.add("cursor-active");
        const rect = el.getBoundingClientRect();
        const ax = e.clientX - rect.left - rect.width / 2;
        const ay = e.clientY - rect.top - rect.height / 2;

        gsap.to(el, { x: ax * (strength / 100), y: ay * (strength / 100), duration: 0.5, ease: "power2.out" });
      });

      el.addEventListener("mouseleave", () => {
        document.body.classList.remove("cursor-active");
        gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" });
      });
    });
    
    // Make text hovered triggers
    document.querySelectorAll("a, button, input").forEach(el => {
        el.addEventListener("mouseenter", () => document.body.classList.add("cursor-active"));
        el.addEventListener("mouseleave", () => document.body.classList.remove("cursor-active"));
    });
  }

  // 3. Hero Reveal Sequence
  const heroLines = document.querySelectorAll(".hero-title .line");
  gsap.fromTo(heroLines, 
    { y: 150, skewY: 5, autoAlpha: 0 },
    { y: 0, skewY: 0, autoAlpha: 1, duration: 1.2, stagger: 0.2, ease: "power4.out", delay: 0.2 }
  );

  const heroUps = document.querySelectorAll(".hero-content .reveal-up");
  gsap.fromTo(heroUps,
    { y: 40, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: 1, stagger: 0.15, ease: "power2.out", delay: 1 }
  );

  // 4. Scroll-Triggered Reveals (Section Headers)
  const revealTexts = gsap.utils.toArray(".reveal-text:not(.hero-title .line)");
  revealTexts.forEach((text) => {
    gsap.fromTo(text,
      { y: 100, autoAlpha: 0 },
      { scrollTrigger: { trigger: text, start: "top 90%", toggleActions: "play none none reverse" },
        y: 0, autoAlpha: 1, duration: 1, ease: "power3.out" }
    );
  });

  const scrollUps = gsap.utils.toArray("section:not(.hero) .reveal-up");
  scrollUps.forEach((elem) => {
    gsap.fromTo(elem,
      { y: 40, autoAlpha: 0 },
      { scrollTrigger: { trigger: elem, start: "top 90%", toggleActions: "play none none reverse" },
        y: 0, autoAlpha: 1, duration: 1, ease: "power2.out" }
    );
  });

  // 5. Bento Grid Staggered Reveal
  const bentoItems = gsap.utils.toArray(".bento-item");
  ScrollTrigger.create({
    trigger: ".bento-grid",
    start: "top 80%",
    animation: gsap.fromTo(bentoItems, 
      { scale: 0.95, y: 50, autoAlpha: 0 }, 
      { scale: 1, y: 0, autoAlpha: 1, duration: 1.4, stagger: 0.1, ease: "power4.out" }
    ),
    toggleActions: "play none none reverse"
  });

  // 6. Contact Form AJAX Submission
  const contactForm = document.querySelector(".full-contact-form");
  const formStatus = document.getElementById("form-status");
  const submitBtn = contactForm.querySelector(".submit-btn");

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      // Update UI to submitting state
      submitBtn.classList.add("submitting");
      const originalBtnText = submitBtn.textContent;
      submitBtn.textContent = "Processing...";
      formStatus.className = "form-status-msg"; // Reset classes
      formStatus.style.display = "none";

      const formData = new FormData(contactForm);
      
      try {
        const response = await fetch(contactForm.action, {
          method: contactForm.method,
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          // Success
          formStatus.textContent = "Thank you! Your message has been sent successfully.";
          formStatus.classList.add("success");
          contactForm.reset();
        } else {
          // Formspree error
          const data = await response.json();
          if (Object.hasOwn(data, 'errors')) {
            formStatus.textContent = data["errors"].map(error => error["message"]).join(", ");
          } else {
            formStatus.textContent = "Oops! There was a problem submitting your form.";
          }
          formStatus.classList.add("error");
        }
      } catch (error) {
        // Network error
        formStatus.textContent = "Oops! Network error. Please try again later.";
        formStatus.classList.add("error");
      } finally {
        submitBtn.classList.remove("submitting");
        submitBtn.textContent = originalBtnText;
        formStatus.style.display = "block";
        
        // Hide success message after 5 seconds
        if (formStatus.classList.contains("success")) {
          setTimeout(() => {
            gsap.to(formStatus, { 
              opacity: 0, 
              duration: 0.5, 
              onComplete: () => {
                formStatus.style.display = "none";
                formStatus.style.opacity = 1;
              }
            });
          }, 5000);
        }
      }
    });
  }
});
