/**
 * Portfolio Complete JavaScript (Refactored)
 * All functionality in a single file for better browser compatibility
 */

(function() {
    'use strict';

    // ==================================
    // == CONFIGURATION & STATE
    // ==================================
    const CONFIG = {
        SCROLL_OFFSET: 100,
        THROTTLE_DELAY: 50,
        INTERSECTION_THRESHOLD: 0.1,
        STORAGE_KEYS: {
            THEME: 'portfolio-theme',
        }
    };

    const SELECTORS = {
        THEME_TOGGLES: '.theme-toggle',
        HEADER: '#header',
        NAV_LINKS: '.nav-link, .mobile-nav-link, .footer-link, .hero-actions a[href^="#"]',
        MOBILE_MENU_TOGGLE: '#mobileMenuToggle',
        MOBILE_NAV: '#mobileNav',
        SCROLL_TOP: '#scrollToTop',
        ANIMATE_ON_SCROLL: '.animate-on-scroll',
        SKILLS_GRID: '.skills-grid',
        PROGRESS_BARS: '.progress-fill',
        SUMMARY_STATS: '.summary-stats',
        STAT_NUMBERS: '.stat-number',
        PROJECT_CARDS: '.project-card',
        MODAL_OVERLAY: '#projectModal',
        MODAL_CONTENT: '#modalContent',
        MODAL_TITLE: '#modalTitle',
        MODAL_CLOSE: '#modalClose',
        LOADING_OVERLAY: '#loadingOverlay',
        GLOW_CARDS: '.skill-category, .certification-card, .project-card, .testimonial-card, .achievement-card',
        DOWNLOAD_RESUME_BTN: '#downloadResume',
        PREVIEW_RESUME_BTN: '#previewResume',
    };
    
    const state = {
        theme: 'light',
        isLoading: true,
        isMobileMenuOpen: false,
        isModalOpen: false,
        hasScrolled: false,
        lastFocusedElement: null,
        projectData: [],
    };

    const domCache = {};

    // ==================================
    // == UTILITY FUNCTIONS
    // ==================================
    const utils = {
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        $(selector) {
            if (!domCache[selector]) {
                domCache[selector] = document.querySelector(selector);
            }
            return domCache[selector];
        },
        $$(selector) {
            if (!domCache[selector]) {
                domCache[selector] = Array.from(document.querySelectorAll(selector));
            }
            return domCache[selector];
        },
        storage: {
            get: (key, defaultValue = null) => {
                try {
                    const value = localStorage.getItem(key);
                    return value ? JSON.parse(value) : defaultValue;
                } catch (e) { return defaultValue; }
            },
            set: (key, value) => {
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                } catch (e) { console.warn('Error saving to localStorage', e); }
            },
        },
        scrollTo(element) {
            if (!element) return;
            const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - CONFIG.SCROLL_OFFSET;
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        },
        addEventListener: (element, event, handler) => {
            if (element) element.addEventListener(event, handler);
        },
    };

    // ==================================
    // == MODULES
    // ==================================
    
    const themeManager = {
        init() {
            const savedTheme = utils.storage.get(CONFIG.STORAGE_KEYS.THEME, 'light');
            this.setTheme(savedTheme);
            this.bindEvents();
        },
        setTheme(theme) {
            state.theme = theme;
            document.body.className = `${theme}-theme`;
            document.body.setAttribute('data-theme', theme);
            utils.storage.set(CONFIG.STORAGE_KEYS.THEME, theme);
        },
        toggleTheme() {
            this.setTheme(state.theme === 'light' ? 'dark' : 'light');
        },
        bindEvents() {
            utils.$$(SELECTORS.THEME_TOGGLES).forEach(toggle => {
                utils.addEventListener(toggle, 'click', () => this.toggleTheme());
            });
        }
    };

    const navigationManager = {
        init() {
            this.updateHeaderState();
            utils.addEventListener(window, 'scroll', utils.throttle(() => this.updateHeaderState(), 100));
            this.bindNavLinks();
            this.bindMobileMenu();
            this.bindScrollToTop();
        },
        updateHeaderState() {
            const header = utils.$(SELECTORS.HEADER);
            if (!header) return;
            const shouldBeScrolled = window.scrollY > 50;
            if (shouldBeScrolled !== state.hasScrolled) {
                state.hasScrolled = shouldBeScrolled;
                header.classList.toggle('scrolled', shouldBeScrolled);
            }
        },
        bindNavLinks() {
            utils.$$(SELECTORS.NAV_LINKS).forEach(link => {
                utils.addEventListener(link, 'click', (e) => {
                    const href = link.getAttribute('href');
                    if (href && href.startsWith('#')) {
                        e.preventDefault();
                        const target = document.querySelector(href);
                        if (target) {
                            utils.scrollTo(target);
                            if (state.isMobileMenuOpen) this.closeMobileMenu();
                        }
                    }
                });
            });
        },
        bindMobileMenu() {
            const toggle = utils.$(SELECTORS.MOBILE_MENU_TOGGLE);
            utils.addEventListener(toggle, 'click', () => this.toggleMobileMenu());
        },
        toggleMobileMenu() {
            state.isMobileMenuOpen ? this.closeMobileMenu() : this.openMobileMenu();
        },
        openMobileMenu() {
            const toggle = utils.$(SELECTORS.MOBILE_MENU_TOGGLE);
            const menu = utils.$(SELECTORS.MOBILE_NAV);
            state.isMobileMenuOpen = true;
            toggle.setAttribute('aria-expanded', 'true');
            menu.classList.add('open');
            document.body.style.overflow = 'hidden';
        },
        closeMobileMenu() {
            const toggle = utils.$(SELECTORS.MOBILE_MENU_TOGGLE);
            const menu = utils.$(SELECTORS.MOBILE_NAV);
            state.isMobileMenuOpen = false;
            toggle.setAttribute('aria-expanded', 'false');
            menu.classList.remove('open');
            document.body.style.overflow = '';
        },
        bindScrollToTop() {
            utils.addEventListener(utils.$(SELECTORS.SCROLL_TOP), 'click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    };

    const animationManager = {
        init() {
            this.observer = new IntersectionObserver(this.handleIntersect.bind(this), {
                threshold: CONFIG.INTERSECTION_THRESHOLD,
            });
            utils.$$(SELECTORS.ANIMATE_ON_SCROLL).forEach(el => this.observer.observe(el));
        },
        handleIntersect(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    if (entry.target.matches(SELECTORS.SKILLS_GRID)) this.animateProgressBars(entry.target);
                    if (entry.target.matches(SELECTORS.SUMMARY_STATS)) this.animateCounters(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        },
        animateProgressBars(container) {
            container.querySelectorAll(SELECTORS.PROGRESS_BARS).forEach(bar => {
                bar.style.width = bar.style.getPropertyValue('--progress');
            });
        },
        animateCounters(container) {
            container.querySelectorAll(SELECTORS.STAT_NUMBERS).forEach(el => {
                const finalText = el.textContent;
                const numMatch = finalText.match(/(\d+)/);
                if (!numMatch) return;

                const finalNumber = parseInt(numMatch[0]);
                const suffix = finalText.substring(numMatch[0].length);
                const duration = 2000;
                let startTime = null;

                const step = (timestamp) => {
                    if (!startTime) startTime = timestamp;
                    const progress = Math.min((timestamp - startTime) / duration, 1);
                    el.textContent = `${Math.floor(progress * finalNumber)}${suffix}`;
                    if (progress < 1) window.requestAnimationFrame(step);
                };
                window.requestAnimationFrame(step);
            });
        }
    };

    const modalManager = {
        init() {
            this.bindProjectCards();
            this.bindModalEvents();
        },
        bindProjectCards() {
            utils.$$(SELECTORS.PROJECT_CARDS).forEach(card => {
                const openModal = () => {
                    const projectId = card.dataset.project;
                    if (projectId) this.openProjectModal(projectId);
                };
                utils.addEventListener(card, 'click', openModal);
                utils.addEventListener(card, 'keydown', e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openModal();
                    }
                });
            });
        },
        bindModalEvents() {
            const modal = utils.$(SELECTORS.MODAL_OVERLAY);
            utils.addEventListener(modal, 'click', (e) => {
                if (e.target === modal) this.closeModal();
            });
            utils.addEventListener(utils.$(SELECTORS.MODAL_CLOSE), 'click', () => this.closeModal());
            utils.addEventListener(document, 'keydown', e => {
                if (e.key === 'Escape' && state.isModalOpen) this.closeModal();
            });
        },
        openProjectModal(projectId) {
            const project = state.projectData.find(p => p.id === projectId);
            if (!project) return;
            
            state.lastFocusedElement = document.activeElement;
            state.isModalOpen = true;

            utils.$(SELECTORS.MODAL_TITLE).textContent = project.title;
            utils.$(SELECTORS.MODAL_CONTENT).innerHTML = this.generateProjectContent(project);
            utils.$(SELECTORS.MODAL_OVERLAY).classList.add('open');
            document.body.style.overflow = 'hidden';

            utils.$(SELECTORS.MODAL_CLOSE).focus();
        },
        generateProjectContent(project) {
            const tagsHtml = project.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
            const resultsHtml = project.results.map(result => `<li>✅ ${result}</li>`).join('');
            return `
                <img src="${project.image}" alt="${project.title} project visualization" class="modal-project-image" width="600" height="400" loading="lazy">
                <div class="modal-tags">${tagsHtml}</div>
                <div class="modal-meta-grid">
                    <div><strong>Duration:</strong><br>${project.duration}</div>
                    <div><strong>Team Size:</strong><br>${project.teamSize}</div>
                    <div><strong>Budget:</strong><br>${project.budget}</div>
                    <div><strong>Status:</strong><br><span class="status-badge ${project.status.toLowerCase().replace(' ', '-')}">${project.status}</span></div>
                </div>
                <div class="modal-details-grid">
                    <div><h4>Problem</h4><p>${project.problem}</p></div>
                    <div><h4>Solution</h4><p>${project.solution}</p></div>
                    <div><h4>Results</h4><ul>${resultsHtml}</ul></div>
                </div>`;
        },
        closeModal() {
            if (!state.isModalOpen) return;
            state.isModalOpen = false;
            utils.$(SELECTORS.MODAL_OVERLAY).classList.remove('open');
            document.body.style.overflow = '';
            if (state.lastFocusedElement) {
                state.lastFocusedElement.focus();
                state.lastFocusedElement = null;
            }
        }
    };
    
    const loadingManager = {
        init() {
            utils.addEventListener(window, 'load', () => this.hideLoading());
        },
        hideLoading() {
            if (!state.isLoading) return;
            const overlay = utils.$(SELECTORS.LOADING_OVERLAY);
            if (overlay) {
                overlay.classList.add('hidden');
                document.body.style.overflow = '';
                state.isLoading = false;
            }
        }
    };

    // ==================================
    // == MAIN APPLICATION
    // ==================================
    class PortfolioApp {
        async init() {
            document.addEventListener('DOMContentLoaded', async () => {
                loadingManager.init();
                await this.loadData();
                
                themeManager.init();
                navigationManager.init();
                animationManager.init();
                modalManager.init();
                this.initCardGlowEffect();
                this.bindResumeActions();

                console.log('Portfolio initialized successfully');
            });
        }
        
        async loadData() {
            try {
                const response = await fetch('projects.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                state.projectData = await response.json();
            } catch (error) {
                console.error("Could not load project data:", error);
            }
        }

        initCardGlowEffect() {
            const cards = utils.$$(SELECTORS.GLOW_CARDS);
            cards.forEach(card => {
                const handleMouseMove = (e) => {
                    const rect = card.getBoundingClientRect();
                    card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                    card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
                };
                utils.addEventListener(card, 'mousemove', utils.throttle(handleMouseMove, CONFIG.THROTTLE_DELAY));
            });
        }

        bindResumeActions() {
            // Placeholder actions for the resume buttons
            utils.addEventListener(utils.$(SELECTORS.DOWNLOAD_RESUME_BTN), 'click', () => {
                alert('Resume download functionality to be implemented.');
                // Example: window.location.href = '/path/to/resume.pdf';
            });
            utils.addEventListener(utils.$(SELECTORS.PREVIEW_RESUME_BTN), 'click', () => {
                alert('Resume preview functionality to be implemented.');
                // Example: window.open('/path/to/resume.pdf', '_blank');
            });
        }
    }

    // Initialize the portfolio
    new PortfolioApp().init();

})();