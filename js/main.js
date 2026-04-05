/**
 * main.js - Main Application Entry Point
 * Initializes all modules and handles main application logic
 */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ============================================
    // DOM ELEMENTS
    // ============================================
    const elements = {
        navbar: document.getElementById('navbar'),
        navToggle: document.getElementById('navToggle'),
        navMenu: document.getElementById('navMenu'),
        navLinks: document.querySelectorAll('.nav-link'),
        backToTop: document.getElementById('backToTop'),
        contactForm: document.getElementById('contactForm'),
        sections: document.querySelectorAll('section[id]')
    };

    // ============================================
    // NAVIGATION
    // ============================================
    function toggleMenu() {
        const isOpen = elements.navMenu.classList.toggle('active');
        elements.navToggle.classList.toggle('active', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    function closeMenu() {
        elements.navMenu.classList.remove('active');
        elements.navToggle.classList.remove('active');
        document.body.style.overflow = '';
    }

    function updateActiveNav() {
        const scrollY = window.scrollY;

        elements.sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                elements.navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });

        // Navbar background
        elements.navbar.classList.toggle('scrolled', scrollY > 50);

        // Back to top button
        elements.backToTop.classList.toggle('visible', scrollY > 500);
    }

    // ============================================
    // SCROLL FUNCTION
    // ============================================
    function handleNavClick(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId && targetId.startsWith('#')) {
            Utils.smoothScrollTo(targetId);
            closeMenu();
        }
    }

    // ============================================
    // FORM HANDLING
    // ============================================
    function handleFormSubmit(e) {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();

        if (!name || !email || !message) {
            Utils.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (!Utils.validateEmail(email)) {
            Utils.showNotification('Please enter a valid email', 'error');
            return;
        }

        const submitBtn = elements.contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        setTimeout(() => {
            Utils.showNotification('Message sent successfully!', 'success');
            elements.contactForm.reset();
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 1500);
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================
    function initEventListeners() {
        // Mobile menu toggle
        if (elements.navToggle) {
            elements.navToggle.addEventListener('click', toggleMenu);
        }

        // Navigation links (navbar)
        elements.navLinks.forEach(link => {
            link.addEventListener('click', handleNavClick);
        });

        // Logo links (SamooForge in navbar & footer) - scroll to home
        document.querySelectorAll('a[href="#home"].nav-logo').forEach(logo => {
            logo.addEventListener('click', handleNavClick);
        });

        // Hero buttons (Lihat Paket & Hubungi Kami)
        document.querySelectorAll('.hero-buttons a[href^="#"]').forEach(btn => {
            btn.addEventListener('click', handleNavClick);
        });

        // Pricing buttons (Pilih Paket) - navigate to contact
        document.querySelectorAll('.pricing-body a[href="#contact"]').forEach(btn => {
            btn.addEventListener('click', handleNavClick);
        });

        // Scroll events
        window.addEventListener('scroll', Utils.throttle(updateActiveNav, 100));

        // Back to top
        if (elements.backToTop) {
            elements.backToTop.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // Form submission
        if (elements.contactForm) {
            elements.contactForm.addEventListener('submit', handleFormSubmit);
        }

        // Close menu on resize if open
        window.addEventListener('resize', Utils.debounce(() => {
            if (window.innerWidth > 768) {
                closeMenu();
            }
        }, 250));
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
        initEventListeners();
        
        // Initialize animations
        if (window.TypingAnimation) {
            TypingAnimation.init('typingText');
        }
        
        if (window.ScrollAnimations) {
            ScrollAnimations.init();
        }

        // Initial nav state
        updateActiveNav();

        console.log('🚀 Samoonier Tech initialized successfully!');
    }

    // Run initialization
    init();
});