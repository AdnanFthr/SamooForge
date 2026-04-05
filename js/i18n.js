/**
 * i18n.js - Internationalization Module
 * Handles language switching and translation loading
 */

const I18n = (function() {
    'use strict';

    const state = {
        currentLang: 'id',
        translations: {}
    };

    async function loadTranslations(lang) {
        console.log(`[i18n] Loading translations for: ${lang}`);
        try {
            const response = await fetch(`./data/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load ${lang}.json (status: ${response.status})`);
            }
            state.translations[lang] = await response.json();
            console.log(`[i18n] Successfully loaded ${lang}.json`);
            return state.translations[lang];
        } catch (error) {
            console.error('[i18n] Error loading translations:', error);
            return null;
        }
    }

    function getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    function updateContent(lang) {
        console.log(`[i18n] Updating content to language: ${lang}`);
        const t = state.translations[lang];
        if (!t) {
            console.error(`[i18n] No translations found for ${lang}`);
            return;
        }

        document.documentElement.lang = lang;
        document.documentElement.dataset.lang = lang;

        // Update all elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');
        console.log(`[i18n] Found ${elements.length} elements to translate`);
        
        elements.forEach(el => {
            const key = el.dataset.i18n;
            const value = getNestedValue(t, key);
            
            if (value !== undefined) {
                // Handle HTML content for specific keys
                if (key.includes('p1') || key.includes('p2') || key.includes('desc') || key.includes('intro') || key.includes('microservices.desc') || key.includes('mvc.desc') || key.includes('custom.desc')) {
                    el.innerHTML = value;
                } else {
                    el.textContent = value;
                }
            } else {
                console.warn(`[i18n] Missing translation for key: ${key}`);
            }
        });

        // Update typing animation texts
        if (t.typing && window.TypingAnimation) {
            console.log('[i18n] Updating typing animation texts');
            window.TypingAnimation.setTexts(t.typing);
        }

        // Update lang switcher UI
        document.querySelectorAll('.lang-btn').forEach(btn => {
            const isActive = btn.dataset.lang === lang;
            btn.classList.toggle('active', isActive);
            console.log(`[i18n] Button ${btn.dataset.lang} active: ${isActive}`);
        });

        state.currentLang = lang;
        localStorage.setItem('portfolio-lang', lang);
        console.log(`[i18n] Language switched to ${lang} and saved to localStorage`);
    }

    async function switchLanguage(lang) {
        console.log(`[i18n] Switch language requested: ${lang}`);
        if (lang === state.currentLang) {
            console.log('[i18n] Language already active, skipping');
            return;
        }
        
        if (!state.translations[lang]) {
            console.log(`[i18n] Loading translations for ${lang}...`);
            await loadTranslations(lang);
        }
        
        updateContent(lang);
        
        // Dispatch custom event for other components
        document.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: lang } 
        }));
    }

    // Add data-i18n attributes to About section dynamically
    function setupAboutSectionTranslations() {
        console.log('[i18n] Setting up About section translations');
        const aboutSection = document.getElementById('about');
        if (!aboutSection) {
            console.warn('[i18n] About section not found');
            return;
        }

        // About header
        const aboutHeader = aboutSection.querySelector('.about-header');
        if (aboutHeader) {
            const h2 = aboutHeader.querySelector('h2');
            const p = aboutHeader.querySelector('p');
            if (h2 && !h2.hasAttribute('data-i18n')) h2.setAttribute('data-i18n', 'about.title');
            if (p && !p.hasAttribute('data-i18n')) p.setAttribute('data-i18n', 'about.subtitle');
        }

        // Tech cards
        const techCards = aboutSection.querySelectorAll('.tech-card');
        techCards.forEach((card, index) => {
            const h3 = card.querySelector('h3');
            const p = card.querySelector('p');
            
            if (index === 0) {
                if (h3 && !h3.hasAttribute('data-i18n')) h3.setAttribute('data-i18n', 'about.microservices.title');
                if (p && !p.hasAttribute('data-i18n')) p.setAttribute('data-i18n', 'about.microservices.desc');
            } else if (index === 1) {
                if (h3 && !h3.hasAttribute('data-i18n')) h3.setAttribute('data-i18n', 'about.mvc.title');
                if (p && !p.hasAttribute('data-i18n')) p.setAttribute('data-i18n', 'about.mvc.desc');
            } else if (index === 2) {
                if (h3 && !h3.hasAttribute('data-i18n')) h3.setAttribute('data-i18n', 'about.custom.title');
                if (p && !p.hasAttribute('data-i18n')) p.setAttribute('data-i18n', 'about.custom.desc');
            }
        });
    }

    function setupEventListeners() {
        console.log('[i18n] Setting up event listeners');
        const langButtons = document.querySelectorAll('.lang-btn');
        console.log(`[i18n] Found ${langButtons.length} language buttons`);
        
        langButtons.forEach(btn => {
            // Remove existing listeners to prevent duplicates
            btn.removeEventListener('click', handleLangClick);
            // Add new listener
            btn.addEventListener('click', handleLangClick);
            console.log(`[i18n] Added click listener to ${btn.dataset.lang} button`);
        });
    }

    function handleLangClick(e) {
        e.preventDefault();
        e.stopPropagation();
        const lang = this.dataset.lang;
        console.log(`[i18n] Language button clicked: ${lang}`);
        switchLanguage(lang);
    }

    async function init() {
        console.log('[i18n] Initializing I18n module...');
        
        const savedLang = localStorage.getItem('portfolio-lang') || 'id';
        console.log(`[i18n] Saved language from localStorage: ${savedLang}`);
        
        // Load both languages
        try {
            await Promise.all([
                loadTranslations('id'),
                loadTranslations('en')
            ]);
            console.log('[i18n] Both languages loaded successfully');
        } catch (error) {
            console.error('[i18n] Error loading translations:', error);
        }

        // Setup dynamic translations for About section
        setupAboutSectionTranslations();

        // Setup event listeners
        setupEventListeners();

        // Apply initial language
        updateContent(savedLang);
        
        console.log('[i18n] Initialization complete');
    }

    return {
        init,
        switchLanguage,
        getCurrentLang: () => state.currentLang,
        getTranslations: () => state.translations[state.currentLang]
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[i18n] DOMContentLoaded fired');
        I18n.init();
    });
} else {
    console.log('[i18n] DOM already loaded, initializing immediately');
    I18n.init();
}