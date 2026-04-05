/**
 * animations.js - Animation Modules
 * Handles all animations: typing, scroll reveal, skill bars, etc.
 */

const TypingAnimation = (function() {
    'use strict';

    let state = {
        texts: ['Full-stack Developer', 'Backend Developer', 'Web Developer'],
        index: 0,
        charIndex: 0,
        isDeleting: false,
        speed: 100,
        element: null
    };

    function setTexts(texts) {
        state.texts = texts;
        state.index = 0;
        state.charIndex = 0;
        state.isDeleting = false;
        if (state.element) {
            state.element.textContent = '';
        }
    }

    function type() {
        if (!state.element) return;

        const currentText = state.texts[state.index];
        
        if (state.isDeleting) {
            state.element.textContent = currentText.substring(0, state.charIndex - 1);
            state.charIndex--;
            state.speed = 50;
        } else {
            state.element.textContent = currentText.substring(0, state.charIndex + 1);
            state.charIndex++;
            state.speed = 100;
        }

        if (!state.isDeleting && state.charIndex === currentText.length) {
            state.isDeleting = true;
            state.speed = 2000;
        } else if (state.isDeleting && state.charIndex === 0) {
            state.isDeleting = false;
            state.index = (state.index + 1) % state.texts.length;
            state.speed = 500;
        }

        setTimeout(type, state.speed);
    }

    function init(elementId) {
        state.element = document.getElementById(elementId);
        if (state.element) {
            setTimeout(type, 1000);
        }
    }

    return { init, setTexts };
})();

const ScrollAnimations = (function() {
    'use strict';

    function initFadeIn() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.section-header, .skill-card, .timeline-item, .contact-item, .project-card')
            .forEach(el => {
                el.classList.add('fade-in');
                observer.observe(el);
            });
    }

    function initSkillCards() {
        const cards = document.querySelectorAll('.modern-card');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 50);
                }
            });
        }, { threshold: 0.1 });

        cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'all 0.5s ease-out';
            observer.observe(card);
        });
    }

    function init() {
        initFadeIn();
        initSkillCards();
    }

    return { init };
})();

// Expose TypingAnimation globally for i18n access
window.TypingAnimation = TypingAnimation;