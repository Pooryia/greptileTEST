/**
 * Grid Animation Application
 * A responsive interactive grid with particle effects and animations
 * Enhanced with accessibility features and keyboard navigation
 */

class GridAnimationApp {
    constructor() {
        // Configuration constants
        this.config = {
            gridSize: 9,
            particlesPerClick: 25,
            smokeParticlesPerClick: 8,
            glowEffectsPerClick: 3,
            sparkleParticlesPerClick: 15,
            rippleEffectsPerClick: 2,
            maxParticles: 1000, // Limit for performance
            animationDuration: 800,
            debounceDelay: 16 // ~60fps
        };

        // State management
        this.state = {
            cells: [],
            canvasParticles: [],
            domParticles: new Set(),
            animationLoopRunning: false,
            isInitialized: false,
            completionEffectActive: false,
            currentFocusIndex: 0,
            flippedCount: 0,
            isMuted: false,
            helpPanelOpen: false
        };

        // DOM element cache
        this.elements = {
            gridContainer: null,
            canvas: null,
            ctx: null,
            particlesContainer: null,
            container: null,
            statusElement: null,
            alertElement: null,
            progressCurrent: null,
            progressFill: null,
            progressContainer: null,
            helpButton: null,
            resetButton: null,
            muteButton: null,
            helpPanel: null,
            closeHelpButton: null
        };

        // Performance optimizations
        this.rafId = null;
        this.resizeTimeout = null;
        this.particlePool = [];

        // Keyboard navigation
        this.keyboardNavigation = {
            enabled: false,
            currentRow: 0,
            currentCol: 0
        };

        // Bind methods
        this.handleCellClick = this.handleCellClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleResize = this.debounce(this.resizeCanvas.bind(this), this.config.debounceDelay);
        this.animateCanvasParticles = this.animateCanvasParticles.bind(this);
        this.handleHelpToggle = this.handleHelpToggle.bind(this);
        this.handleReset = this.handleReset.bind(this);
        this.handleMuteToggle = this.handleMuteToggle.bind(this);
        this.handleGridFocus = this.handleGridFocus.bind(this);
        this.handleGridBlur = this.handleGridBlur.bind(this);
    }

    /**
     * Initialize the application
     */
    init() {
        try {
            if (this.state.isInitialized) {
                console.warn('GridAnimationApp already initialized');
                return;
            }

            this.cacheElements();
            this.setupCanvas();
            this.initializeGrid();
            this.setupEventListeners();
            this.setupControls();
            this.updateProgress();
            this.state.isInitialized = true;
            
            // Announce initialization to screen readers
            this.announceToScreenReader('Grid animation loaded. Use arrow keys to navigate and spacebar to flip cells.');
            
            console.log('GridAnimationApp initialized successfully');
        } catch (error) {
            console.error('Failed to initialize GridAnimationApp:', error);
            this.showFallbackMessage();
        }
    }

    /**
     * Cache DOM elements for performance
     */
    cacheElements() {
        this.elements.gridContainer = document.getElementById('grid');
        this.elements.canvas = document.getElementById('particleCanvas');
        this.elements.container = document.querySelector('.container');
        this.elements.statusElement = document.getElementById('status');
        this.elements.alertElement = document.getElementById('alert');
        this.elements.progressCurrent = document.getElementById('progress-current');
        this.elements.progressFill = document.querySelector('.progress-fill');
        this.elements.progressContainer = document.querySelector('.progress-container');
        this.elements.helpButton = document.getElementById('help-button');
        this.elements.resetButton = document.getElementById('reset-button');
        this.elements.muteButton = document.getElementById('mute-button');
        this.elements.helpPanel = document.getElementById('help-panel');
        this.elements.closeHelpButton = document.getElementById('close-help');

        // Verify required elements exist
        const requiredElements = ['gridContainer', 'canvas', 'container'];
        for (const elementKey of requiredElements) {
            if (!this.elements[elementKey]) {
                throw new Error(`Required DOM element not found: ${elementKey}`);
            }
        }

        this.elements.ctx = this.elements.canvas.getContext('2d');
        if (!this.elements.ctx) {
            throw new Error('Canvas context not available');
        }

        // Create particles container
        this.elements.particlesContainer = document.createElement('div');
        this.elements.particlesContainer.className = 'particles-container';
        this.elements.container.appendChild(this.elements.particlesContainer);
    }

    /**
     * Setup canvas with proper sizing and DPI handling
     */
    setupCanvas() {
        this.resizeCanvas();
    }

    /**
     * Resize canvas with debouncing and proper DPI handling
     */
    resizeCanvas() {
        try {
            const rect = this.elements.container.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            
            // Set actual canvas size
            this.elements.canvas.width = rect.width * dpr;
            this.elements.canvas.height = rect.height * dpr;
            
            // Scale context for DPI
            this.elements.ctx.scale(dpr, dpr);
            
            // Set display size
            this.elements.canvas.style.width = `${rect.width}px`;
            this.elements.canvas.style.height = `${rect.height}px`;
        } catch (error) {
            console.error('Canvas resize failed:', error);
        }
    }

    /**
     * Setup event listeners with proper cleanup
     */
    setupEventListeners() {
        // Window events
        window.addEventListener('resize', this.handleResize, { passive: true });
        
        // Grid keyboard navigation
        this.elements.gridContainer.addEventListener('keydown', this.handleKeyDown);
        this.elements.gridContainer.addEventListener('focus', this.handleGridFocus);
        this.elements.gridContainer.addEventListener('blur', this.handleGridBlur);
        
        // Add visibility change listener for performance
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimations();
            } else {
                this.resumeAnimations();
            }
        });

        // Add beforeunload for cleanup
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // Touch events for mobile
        this.elements.gridContainer.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    /**
     * Setup control buttons
     */
    setupControls() {
        // Help button
        if (this.elements.helpButton) {
            this.elements.helpButton.addEventListener('click', this.handleHelpToggle);
        }

        // Reset button
        if (this.elements.resetButton) {
            this.elements.resetButton.addEventListener('click', this.handleReset);
        }

        // Mute button
        if (this.elements.muteButton) {
            this.elements.muteButton.addEventListener('click', this.handleMuteToggle);
        }

        // Close help button
        if (this.elements.closeHelpButton) {
            this.elements.closeHelpButton.addEventListener('click', this.handleHelpToggle);
        }

        // Help panel escape key
        if (this.elements.helpPanel) {
            this.elements.helpPanel.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.handleHelpToggle();
                }
            });
        }
    }

    /**
     * Handle help panel toggle
     */
    handleHelpToggle() {
        this.state.helpPanelOpen = !this.state.helpPanelOpen;
        
        if (this.elements.helpPanel) {
            this.elements.helpPanel.classList.toggle('active', this.state.helpPanelOpen);
            this.elements.helpPanel.setAttribute('aria-hidden', !this.state.helpPanelOpen);
            
            if (this.state.helpPanelOpen) {
                // Focus the close button when opening
                setTimeout(() => {
                    if (this.elements.closeHelpButton) {
                        this.elements.closeHelpButton.focus();
                    }
                }, 300);
            } else {
                // Return focus to help button when closing
                if (this.elements.helpButton) {
                    this.elements.helpButton.focus();
                }
            }
        }
    }

    /**
     * Handle reset button
     */
    handleReset() {
        try {
            // Reset all cells
            this.state.cells.forEach(cell => {
                cell.classList.remove('flipped');
                cell.style.animation = '';
                cell.dataset.animating = 'false';
            });

            // Reset state
            this.state.flippedCount = 0;
            this.state.completionEffectActive = false;

            // Clear particles
            this.clearAllParticles();

            // Update progress
            this.updateProgress();

            // Update grid attributes
            if (this.elements.gridContainer) {
                this.elements.gridContainer.setAttribute('data-flipped-cells', '0');
            }

            // Announce reset
            this.announceToScreenReader('Grid reset. All cells are now unflipped.');

        } catch (error) {
            console.error('Reset failed:', error);
        }
    }

    /**
     * Handle mute toggle
     */
    handleMuteToggle() {
        this.state.isMuted = !this.state.isMuted;
        
        if (this.elements.muteButton) {
            this.elements.muteButton.setAttribute('aria-pressed', this.state.isMuted);
            const icon = this.elements.muteButton.querySelector('[aria-hidden="true"]');
            const text = this.elements.muteButton.querySelector('.sr-only');
            
            if (icon && text) {
                if (this.state.isMuted) {
                    icon.textContent = '🔇';
                    text.textContent = 'Sound off';
                    this.elements.muteButton.setAttribute('aria-label', 'Unmute sound effects');
                } else {
                    icon.textContent = '🔊';
                    text.textContent = 'Sound on';
                    this.elements.muteButton.setAttribute('aria-label', 'Mute sound effects');
                }
            }
        }
    }

    /**
     * Handle grid focus for keyboard navigation
     */
    handleGridFocus() {
        this.keyboardNavigation.enabled = true;
        this.updateActiveCell();
    }

    /**
     * Handle grid blur
     */
    handleGridBlur() {
        this.keyboardNavigation.enabled = false;
        // Remove active class from all cells
        this.state.cells.forEach(cell => cell.classList.remove('active'));
    }

    /**
     * Handle keyboard navigation
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyDown(event) {
        if (!this.keyboardNavigation.enabled) return;

        const { key } = event;
        let handled = false;

        switch (key) {
            case 'ArrowUp':
                this.keyboardNavigation.currentRow = Math.max(0, this.keyboardNavigation.currentRow - 1);
                handled = true;
                break;
            case 'ArrowDown':
                this.keyboardNavigation.currentRow = Math.min(this.config.gridSize - 1, this.keyboardNavigation.currentRow + 1);
                handled = true;
                break;
            case 'ArrowLeft':
                this.keyboardNavigation.currentCol = Math.max(0, this.keyboardNavigation.currentCol - 1);
                handled = true;
                break;
            case 'ArrowRight':
                this.keyboardNavigation.currentCol = Math.min(this.config.gridSize - 1, this.keyboardNavigation.currentCol + 1);
                handled = true;
                break;
            case ' ':
            case 'Enter':
                const activeCell = this.getCurrentCell();
                if (activeCell) {
                    this.handleCellClick({ target: activeCell, preventDefault: () => {} });
                }
                handled = true;
                break;
            case 'Home':
                this.keyboardNavigation.currentRow = 0;
                this.keyboardNavigation.currentCol = 0;
                handled = true;
                break;
            case 'End':
                this.keyboardNavigation.currentRow = this.config.gridSize - 1;
                this.keyboardNavigation.currentCol = this.config.gridSize - 1;
                handled = true;
                break;
        }

        if (handled) {
            event.preventDefault();
            this.updateActiveCell();
        }
    }

    /**
     * Get current cell based on keyboard navigation
     * @returns {HTMLElement|null} Current cell element
     */
    getCurrentCell() {
        const index = this.keyboardNavigation.currentRow * this.config.gridSize + this.keyboardNavigation.currentCol;
        return this.state.cells[index] || null;
    }

    /**
     * Update active cell for keyboard navigation
     */
    updateActiveCell() {
        // Remove active class from all cells
        this.state.cells.forEach(cell => cell.classList.remove('active'));
        
        // Add active class to current cell
        const currentCell = this.getCurrentCell();
        if (currentCell) {
            currentCell.classList.add('active');
            
            // Announce current position to screen readers
            const row = this.keyboardNavigation.currentRow + 1;
            const col = this.keyboardNavigation.currentCol + 1;
            const isFlipped = currentCell.classList.contains('flipped') ? 'flipped' : 'unflipped';
            this.announceToScreenReader(`Cell ${row}, ${col}, ${isFlipped}`);
        }
    }

    /**
     * Initialize the grid and create all cells
     */
    initializeGrid() {
        const fragment = document.createDocumentFragment();
        this.state.cells = [];

        for (let i = 0; i < this.config.gridSize * this.config.gridSize; i++) {
            const cell = this.createCell(i);
            this.state.cells.push(cell);
            fragment.appendChild(cell);
        }

        this.elements.gridContainer.appendChild(fragment);
    }

    /**
     * Create a single grid cell
     * @param {number} index - Cell index
     * @returns {HTMLElement} The created cell element
     */
    createCell(index) {
        const cell = document.createElement('div');
        const row = Math.floor(index / this.config.gridSize);
        const col = index % this.config.gridSize;

        cell.className = 'cell';
        cell.id = `cell-${row}-${col}`;
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.dataset.animating = 'false';
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-label', `Cell ${row + 1}, ${col + 1}, unflipped`);
        cell.setAttribute('tabindex', '-1');

        // Set CSS custom properties for animations
        this.setCellProperties(cell, row, col);

        // Add event listeners with passive option where possible
        cell.addEventListener('click', this.handleCellClick, { passive: false });
        
        // Add touch support
        cell.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleCellClick(e);
        }, { passive: false });

        return cell;
    }

    /**
     * Set CSS custom properties for cell
     * @param {HTMLElement} cell - The cell element
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    setCellProperties(cell, row, col) {
        const bgPosX = (col / (this.config.gridSize - 1)) * 100;
        const bgPosY = (row / (this.config.gridSize - 1)) * 100;
        const initialDelay = (row + col) * 50;

        cell.style.setProperty('--row', row);
        cell.style.setProperty('--col', col);
        cell.style.setProperty('--bg-pos-x', `${bgPosX}%`);
        cell.style.setProperty('--bg-pos-y', `${bgPosY}%`);
        cell.style.setProperty('--bg-size-x', `${this.config.gridSize * 100}%`);
        cell.style.setProperty('--bg-size-y', `${this.config.gridSize * 100}%`);
        cell.style.backgroundPosition = `${bgPosX}% ${bgPosY}%`;
        cell.style.backgroundSize = `${this.config.gridSize * 100}% ${this.config.gridSize * 100}%`;
        cell.style.animationDelay = `${initialDelay}ms`;
    }

    /**
     * Handle cell click with improved error handling and performance
     * @param {Event} event - The click event
     */
    handleCellClick(event) {
        try {
            event.preventDefault();
            
            const cell = event.currentTarget || event.target.closest('.cell');
            if (!cell || cell.dataset.animating === 'true') {
                return;
            }

            const row = parseInt(cell.dataset.row, 10);
            const col = parseInt(cell.dataset.col, 10);
            const rect = cell.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            this.animateCell(cell, centerX, centerY, row, col);
            
            // Update keyboard navigation position when clicking
            this.keyboardNavigation.currentRow = row;
            this.keyboardNavigation.currentCol = col;
            
        } catch (error) {
            console.error('Cell click handler failed:', error);
        }
    }

    /**
     * Animate a cell with proper state management
     * @param {HTMLElement} cell - The cell to animate
     * @param {number} centerX - X coordinate of cell center
     * @param {number} centerY - Y coordinate of cell center
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    animateCell(cell, centerX, centerY, row, col) {
        cell.dataset.animating = 'true';

        if (cell.classList.contains('flipped')) {
            this.flipCellBack(cell);
        } else {
            this.flipCellForward(cell, centerX, centerY, row, col);
        }
    }

    /**
     * Flip cell back to original state
     * @param {HTMLElement} cell - The cell to flip back
     */
    flipCellBack(cell) {
        cell.style.animation = 'rotate-scale 0.8s reverse forwards';
        
        setTimeout(() => {
            cell.classList.remove('flipped');
            cell.dataset.animating = 'false';
            cell.style.animation = '';
            
            // Update state and progress
            this.state.flippedCount--;
            this.updateProgress();
            
            // Update accessibility
            const row = parseInt(cell.dataset.row, 10) + 1;
            const col = parseInt(cell.dataset.col, 10) + 1;
            cell.setAttribute('aria-label', `Cell ${row}, ${col}, unflipped`);
            
        }, this.config.animationDuration);
    }

    /**
     * Flip cell forward and create effects
     * @param {HTMLElement} cell - The cell to flip
     * @param {number} centerX - X coordinate of cell center
     * @param {number} centerY - Y coordinate of cell center
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    flipCellForward(cell, centerX, centerY, row, col) {
        const rotationStyle = this.getRandomRotationStyle();
        cell.style.animation = rotationStyle.animation;

        // Create particle effects
        this.createParticleEffects(centerX, centerY, row, col);
        this.createCanvasParticles(centerX, centerY, row, col);

        setTimeout(() => {
            cell.classList.add('flipped');
            
            // Update state and progress
            this.state.flippedCount++;
            this.updateProgress();
            
            // Update accessibility
            const rowLabel = row + 1;
            const colLabel = col + 1;
            cell.setAttribute('aria-label', `Cell ${rowLabel}, ${colLabel}, flipped`);
            
            this.checkAllFlipped();
            
            setTimeout(() => {
                cell.dataset.animating = 'false';
            }, 750);
        }, 50);
    }

    /**
     * Update progress indicator
     */
    updateProgress() {
        const percentage = (this.state.flippedCount / (this.config.gridSize * this.config.gridSize)) * 100;
        
        if (this.elements.progressCurrent) {
            this.elements.progressCurrent.textContent = this.state.flippedCount;
        }
        
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${percentage}%`;
        }
        
        if (this.elements.progressContainer) {
            this.elements.progressContainer.setAttribute('aria-valuenow', this.state.flippedCount);
        }
        
        if (this.elements.gridContainer) {
            this.elements.gridContainer.setAttribute('data-flipped-cells', this.state.flippedCount);
        }
    }

    /**
     * Create canvas-based particles with object pooling
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    createCanvasParticles(x, y, row, col) {
        try {
            // Limit particles for performance
            if (this.state.canvasParticles.length > this.config.maxParticles) {
                this.state.canvasParticles.splice(0, this.config.maxParticles / 2);
            }

            const hueBase = 240 + ((row + col) / (this.config.gridSize * 2 - 2)) * 60;
            const containerRect = this.elements.container.getBoundingClientRect();
            const canvasX = x - containerRect.left;
            const canvasY = y - containerRect.top;

            for (let i = 0; i < 30; i++) {
                const particle = this.getParticleFromPool() || this.createParticle();
                
                Object.assign(particle, {
                    x: canvasX,
                    y: canvasY,
                    size: Math.random() * 5 + 2,
                    speedX: (Math.random() - 0.5) * 3,
                    speedY: (Math.random() - 0.5) * 3,
                    life: Math.random() * 100 + 50,
                    color: this.getParticleColor(hueBase),
                    glow: Math.random() > 0.7,
                    active: true
                });

                particle.fullLife = particle.life;
                this.state.canvasParticles.push(particle);
            }

            this.startAnimationLoop();
        } catch (error) {
            console.error('Canvas particle creation failed:', error);
        }
    }

    /**
     * Get particle from pool or create new one
     * @returns {Object} Particle object
     */
    getParticleFromPool() {
        return this.particlePool.pop();
    }

    /**
     * Create new particle object
     * @returns {Object} Particle object
     */
    createParticle() {
        return {
            x: 0, y: 0, size: 0, speedX: 0, speedY: 0,
            life: 0, fullLife: 0, color: '', glow: false, active: false
        };
    }

    /**
     * Return particle to pool
     * @param {Object} particle - Particle to return to pool
     */
    returnParticleToPool(particle) {
        particle.active = false;
        if (this.particlePool.length < 100) {
            this.particlePool.push(particle);
        }
    }

    /**
     * Get particle color based on hue
     * @param {number} hueBase - Base hue value
     * @returns {string} HSL color string
     */
    getParticleColor(hueBase) {
        const hue = hueBase + Math.random() * 30 - 15;
        const saturation = Math.floor(Math.random() * 30) + 70;
        const lightness = Math.floor(Math.random() * 20) + 50;
        const alpha = Math.random() * 0.5 + 0.5;
        return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
    }

    /**
     * Start animation loop if not already running
     */
    startAnimationLoop() {
        if (!this.state.animationLoopRunning) {
            this.state.animationLoopRunning = true;
            this.animateCanvasParticles();
        }
    }

    /**
     * Animate canvas particles with improved performance
     */
    animateCanvasParticles() {
        try {
            if (!this.state.animationLoopRunning || !this.elements.ctx) {
                return;
            }

            // Clear canvas
            this.elements.ctx.clearRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);

            // Update and draw particles
            for (let i = this.state.canvasParticles.length - 1; i >= 0; i--) {
                const particle = this.state.canvasParticles[i];
                
                if (!particle.active || particle.life <= 0) {
                    this.returnParticleToPool(particle);
                    this.state.canvasParticles.splice(i, 1);
                    continue;
                }

                this.updateParticle(particle);
                this.drawParticle(particle);
            }

            // Continue animation if particles exist
            if (this.state.canvasParticles.length > 0) {
                this.rafId = requestAnimationFrame(this.animateCanvasParticles);
            } else {
                this.state.animationLoopRunning = false;
            }
        } catch (error) {
            console.error('Canvas animation failed:', error);
            this.state.animationLoopRunning = false;
        }
    }

    /**
     * Update particle properties
     * @param {Object} particle - Particle to update
     */
    updateParticle(particle) {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.life -= 1;
        particle.speedY += 0.1; // Gravity
        particle.speedX *= 0.99; // Air resistance
    }

    /**
     * Draw particle on canvas
     * @param {Object} particle - Particle to draw
     */
    drawParticle(particle) {
        const alpha = particle.life / particle.fullLife;
        this.elements.ctx.globalAlpha = alpha;
        this.elements.ctx.fillStyle = particle.color;
        
        this.elements.ctx.beginPath();
        this.elements.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.elements.ctx.fill();
        
        if (particle.glow) {
            this.elements.ctx.shadowBlur = 10;
            this.elements.ctx.shadowColor = particle.color;
            this.elements.ctx.fill();
            this.elements.ctx.shadowBlur = 0;
        }
    }

    /**
     * Create DOM-based particle effects with cleanup
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    createParticleEffects(x, y, row, col) {
        try {
            const hueBase = 240 + ((row + col) / (this.config.gridSize * 2 - 2)) * 60;
            const containerRect = this.elements.container.getBoundingClientRect();
            
            // Limit DOM particles for performance
            if (this.state.domParticles.size > 200) {
                this.cleanupOldParticles();
            }

            this.createDOMParticles(x - containerRect.left, y - containerRect.top, this.config.particlesPerClick, hueBase);
            this.createSmokeParticles(x - containerRect.left, y - containerRect.top, this.config.smokeParticlesPerClick, hueBase);
            this.createGlowEffects(x - containerRect.left, y - containerRect.top, this.config.glowEffectsPerClick, hueBase);
        } catch (error) {
            console.error('DOM particle creation failed:', error);
        }
    }

    /**
     * Create DOM particles with proper cleanup
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} count - Number of particles
     * @param {number} hueBase - Base hue value
     */
    createDOMParticles(x, y, count, hueBase) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = Math.random() * 8 + 4;
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const distance = Math.random() * 150 + 50;
            const duration = Math.random() * 1000 + 1500;
            
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.style.cssText = `
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                --tx: ${tx}px;
                --ty: ${ty}px;
                animation: particle-fade ${duration}ms ease-out forwards;
                background-color: ${this.getParticleColor(hueBase)};
            `;
            
            this.elements.particlesContainer.appendChild(particle);
            this.state.domParticles.add(particle);
            
            // Auto cleanup
            setTimeout(() => {
                this.removeParticle(particle);
            }, duration);
        }
    }

    /**
     * Create smoke particles
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} count - Number of particles
     * @param {number} hueBase - Base hue value
     */
    createSmokeParticles(x, y, count, hueBase) {
        for (let i = 0; i < count; i++) {
            const smoke = document.createElement('div');
            smoke.className = 'smoke';
            
            const size = Math.random() * 30 + 20;
            const tx = (Math.random() - 0.5) * 100;
            const ty = -(Math.random() * 200 + 100);
            const duration = Math.random() * 2000 + 2000;
            
            smoke.style.cssText = `
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                --tx: ${tx}px;
                --ty: ${ty}px;
                animation: smoke-rise ${duration}ms ease-out forwards;
            `;
            
            this.elements.particlesContainer.appendChild(smoke);
            this.state.domParticles.add(smoke);
            
            setTimeout(() => {
                this.removeParticle(smoke);
            }, duration);
        }
    }

    /**
     * Create glow effects
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} count - Number of effects
     * @param {number} hueBase - Base hue value
     */
    createGlowEffects(x, y, count, hueBase) {
        for (let i = 0; i < count; i++) {
            const glow = document.createElement('div');
            glow.className = 'glow';
            
            const size = Math.random() * 60 + 40;
            const duration = Math.random() * 1000 + 1000;
            
            glow.style.cssText = `
                left: ${x - size/2}px;
                top: ${y - size/2}px;
                width: ${size}px;
                height: ${size}px;
                animation: glow-pulse ${duration}ms ease-out forwards;
            `;
            
            this.elements.particlesContainer.appendChild(glow);
            this.state.domParticles.add(glow);
            
            setTimeout(() => {
                this.removeParticle(glow);
            }, duration);
        }
    }

    /**
     * Remove particle from DOM and tracking
     * @param {HTMLElement} particle - Particle element to remove
     */
    removeParticle(particle) {
        if (particle && particle.parentNode) {
            particle.parentNode.removeChild(particle);
            this.state.domParticles.delete(particle);
        }
    }

    /**
     * Clean up old particles to prevent memory issues
     */
    cleanupOldParticles() {
        const particlesArray = Array.from(this.state.domParticles);
        const toRemove = particlesArray.slice(0, Math.floor(particlesArray.length / 2));
        
        toRemove.forEach(particle => {
            this.removeParticle(particle);
        });
    }

    /**
     * Clear all particles (used in reset)
     */
    clearAllParticles() {
        // Clear canvas particles
        this.state.canvasParticles = [];
        
        // Clear DOM particles
        this.state.domParticles.forEach(particle => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        });
        this.state.domParticles.clear();
        
        // Cancel animation frame
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        this.state.animationLoopRunning = false;
    }

    /**
     * Get random rotation animation style
     * @returns {Object} Animation style object
     */
    getRandomRotationStyle() {
        const styles = [
            { animation: 'rotate-scale 0.8s ease forwards' },
            { animation: 'flip-in 0.8s ease forwards' },
            { animation: 'spin-out 0.8s ease forwards' },
            { animation: 'pulse 0.8s ease forwards' }
        ];
        return styles[Math.floor(Math.random() * styles.length)];
    }

    /**
     * Check if all cells are flipped and trigger completion effect
     */
    checkAllFlipped() {
        const totalCells = this.config.gridSize * this.config.gridSize;
        
        if (this.state.flippedCount === totalCells && !this.state.completionEffectActive) {
            this.state.completionEffectActive = true;
            
            // Announce completion
            this.announceToScreenReader('Congratulations! All cells are flipped. Completion animation starting.');
            
            setTimeout(() => {
                this.createCompletionEffect();
            }, 500);
        }
    }

    /**
     * Create completion effect when all cells are flipped
     */
    createCompletionEffect() {
        try {
            const containerRect = this.elements.container.getBoundingClientRect();
            const centerX = containerRect.width / 2;
            const centerY = containerRect.height / 2;
            
            this.createGrandFinaleEffect(centerX, centerY);
            
            // Reset after effect
            setTimeout(() => {
                this.state.completionEffectActive = false;
                this.announceToScreenReader('Completion animation finished.');
            }, 5000);
        } catch (error) {
            console.error('Completion effect failed:', error);
            this.state.completionEffectActive = false;
        }
    }

    /**
     * Create grand finale effect
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     */
    createGrandFinaleEffect(centerX, centerY) {
        // Create burst of particles
        for (let i = 0; i < 100; i++) {
            const angle = (Math.PI * 2 * i) / 100;
            const distance = Math.random() * 300 + 100;
            const size = Math.random() * 12 + 6;
            
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                left: ${centerX}px;
                top: ${centerY}px;
                width: ${size}px;
                height: ${size}px;
                background: hsl(${Math.random() * 360}, 80%, 60%);
                animation: particle-fade 3000ms ease-out forwards;
                --tx: ${Math.cos(angle) * distance}px;
                --ty: ${Math.sin(angle) * distance}px;
            `;
            
            this.elements.particlesContainer.appendChild(particle);
            this.state.domParticles.add(particle);
            
            setTimeout(() => {
                this.removeParticle(particle);
            }, 3000);
        }
    }

    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     * @param {boolean} isAlert - Whether to use alert (assertive) or status (polite)
     */
    announceToScreenReader(message, isAlert = false) {
        const targetElement = isAlert ? this.elements.alertElement : this.elements.statusElement;
        if (targetElement) {
            targetElement.textContent = message;
            // Clear after a delay to avoid repeated announcements
            setTimeout(() => {
                targetElement.textContent = '';
            }, 1000);
        }
    }

    /**
     * Pause animations for performance when tab is hidden
     */
    pauseAnimations() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.state.animationLoopRunning = false;
    }

    /**
     * Resume animations when tab becomes visible
     */
    resumeAnimations() {
        if (this.state.canvasParticles.length > 0 && !this.state.animationLoopRunning) {
            this.startAnimationLoop();
        }
    }

    /**
     * Show fallback message if initialization fails
     */
    showFallbackMessage() {
        if (this.elements.container) {
            this.elements.container.innerHTML = `
                <div style="color: white; text-align: center; padding: 2rem;">
                    <h2>Grid Animation</h2>
                    <p>Sorry, this interactive grid requires a modern browser with JavaScript enabled.</p>
                </div>
            `;
        }
    }

    /**
     * Cleanup resources and event listeners
     */
    cleanup() {
        // Cancel animation frame
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }

        // Clear timeouts
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }

        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        
        // Clear particles
        this.clearAllParticles();

        // Clear state
        this.state.animationLoopRunning = false;
        this.state.isInitialized = false;
    }

    /**
     * Debounce function for performance optimization
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
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
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        const app = new GridAnimationApp();
        app.init();
        
        // Make app globally accessible for debugging
        window.gridApp = app;
    } catch (error) {
        console.error('Failed to start Grid Animation App:', error);
    }
}, { once: true });

// Handle module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GridAnimationApp;
} 