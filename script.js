document.addEventListener('DOMContentLoaded', () => {
    // Constants for grid and effects
    const gridContainer = document.getElementById('grid');
    const gridSize = 9;
    const cells = [];
    const particlesPerClick = 25;
    const smokeParticlesPerClick = 8;
    const glowEffectsPerClick = 3;
    const sparkleParticlesPerClick = 15;
    const rippleEffectsPerClick = 2;
    
    // Canvas setup for advanced particle effects
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match container
    function resizeCanvas() {
        const container = document.querySelector('.container');
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Set device pixel ratio for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
    }
    
    // Call resize on load and window resize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Canvas particle system
    const canvasParticles = [];
    
    // Create a separate container for DOM particles to improve performance
    const particlesContainer = document.createElement('div');
    particlesContainer.classList.add('particles-container');
    document.querySelector('.container').appendChild(particlesContainer);
    
    /**
     * Initialize the grid and create all cells
     */
    function initializeGrid() {
        // Generate grid cells
        for (let i = 0; i < gridSize * gridSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            
            // Calculate row and column for position-based effects
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            
            // Add custom properties for position-aware animations
            cell.style.setProperty('--row', row);
            cell.style.setProperty('--col', col);
            
            // Set background position to create a unified gradient effect
            // Each cell shows only a portion of the full gradient
            const bgPosX = (col / (gridSize - 1)) * 100;
            const bgPosY = (row / (gridSize - 1)) * 100;
            
            // Set the background position for each cell to create a unified gradient
            cell.style.setProperty('--bg-pos-x', `${bgPosX}%`);
            cell.style.setProperty('--bg-pos-y', `${bgPosY}%`);
            
            // Calculate the background size to make the gradient span the entire grid
            cell.style.setProperty('--bg-size-x', `${gridSize * 100}%`);
            cell.style.setProperty('--bg-size-y', `${gridSize * 100}%`);
            
            // Set the cell's before element to show the proper part of the gradient
            cell.style.setProperty('background-position', `${bgPosX}% ${bgPosY}%`);
            cell.style.setProperty('background-size', `${gridSize * 100}% ${gridSize * 100}%`);
            
            // Add initial animation delay based on position for diagonal wave effect
            const initialDelay = (row + col) * 50;
            cell.style.animationDelay = `${initialDelay}ms`;
            
            // Create a unique cell ID for tracking
            const cellId = `cell-${row}-${col}`;
            cell.id = cellId;
            
            // Add click event listener
            cell.addEventListener('click', (event) => handleCellClick(event, cell, row, col));
            
            cells.push(cell);
            gridContainer.appendChild(cell);
        }
    }
    
    /**
     * Handles the click event on a cell
     * @param {Event} event - The click event
     * @param {HTMLElement} cell - The cell element that was clicked
     * @param {number} row - The row index of the cell
     * @param {number} col - The column index of the cell
     */
    function handleCellClick(event, cell, row, col) {
        // Prevent default to avoid any browser-specific issues
        event.preventDefault();
        
        // Get accurate cell position for particle effects
        const rect = cell.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Check if the cell is currently being animated
        if (cell.dataset.animating === 'true') {
            return; // Skip if animation is in progress
        }
        
        // Set animating flag
        cell.dataset.animating = 'true';
        
        if (cell.classList.contains('flipped')) {
            // If already flipped, flip back to original state
            cell.style.animation = 'rotate-scale 0.8s reverse forwards';
            
            // Remove flipped class after animation completes
            setTimeout(() => {
                cell.classList.remove('flipped');
                cell.dataset.animating = 'false'; // Clear animating flag
            }, 800);
        } else {
            // Apply random rotation style
            const rotationStyle = getRandomRotationStyle();
            cell.style.animation = rotationStyle.animation;
            
            // Create DOM-based particle effects at the click position
            createParticleEffects(centerX, centerY, row, col);
            
            // Create canvas-based particle effects at the click position
            createCanvasParticles(centerX, centerY, row, col);
            
            // Add flipped class after a small delay to ensure animation starts
            setTimeout(() => {
                cell.classList.add('flipped');
                
                // Check if all cells are flipped
                checkAllFlipped();
                
                // Clear animating flag after animation completes
                setTimeout(() => {
                    cell.dataset.animating = 'false';
                }, 750);
            }, 50);
        }
    }
    
    /**
     * Creates canvas-based particles at the specified position
     * @param {number} x - The x-coordinate of the effect center
     * @param {number} y - The y-coordinate of the effect center
     * @param {number} row - The row index of the cell
     * @param {number} col - The column index of the cell
     */
    function createCanvasParticles(x, y, row, col) {
        const hueBase = 240 + ((row + col) / (gridSize * 2 - 2)) * 60; // Blue to purple range
        
        // Convert page coordinates to canvas coordinates
        const container = document.querySelector('.container');
        const containerRect = container.getBoundingClientRect();
        const canvasX = x - containerRect.left;
        const canvasY = y - containerRect.top;
        
        // Create fluid particles
        for (let i = 0; i < 30; i++) {
            const size = Math.random() * 5 + 2;
            const speedX = (Math.random() - 0.5) * 3;
            const speedY = (Math.random() - 0.5) * 3;
            const life = Math.random() * 100 + 50;
            
            // Color variation based on position
            const hue = hueBase + Math.random() * 30 - 15;
            const saturation = Math.floor(Math.random() * 30) + 70; // 70-100%
            const lightness = Math.floor(Math.random() * 20) + 50; // 50-70%
            const alpha = Math.random() * 0.5 + 0.5;
            
            canvasParticles.push({
                x: canvasX,
                y: canvasY,
                size,
                speedX,
                speedY,
                life,
                fullLife: life,
                color: `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`,
                glow: Math.random() > 0.7 // 30% chance of glowing particles
            });
        }
        
        // Start animation loop if not already running
        if (!animationLoopRunning) {
            animationLoopRunning = true;
            animateCanvasParticles();
        }
    }
    
    // Animation loop flag
    let animationLoopRunning = false;
    
    /**
     * Animates all canvas particles
     */
    function animateCanvasParticles() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw particles
        for (let i = canvasParticles.length - 1; i >= 0; i--) {
            const p = canvasParticles[i];
            
            // Update position
            p.x += p.speedX;
            p.y += p.speedY;
            
            // Apply gravity and friction
            p.speedY += 0.03;
            p.speedX *= 0.99;
            p.speedY *= 0.99;
            
            // Decrease life
            p.life--;
            
            // Calculate opacity based on remaining life
            const opacity = p.life / p.fullLife;
            
            // Draw particle
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            
            // Add glow effect for special particles
            if (p.glow) {
                ctx.save();
                ctx.filter = `blur(${p.size * 2}px)`;
                ctx.globalAlpha = opacity * 0.5;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
                ctx.restore();
            }
            
            // Remove dead particles
            if (p.life <= 0) {
                canvasParticles.splice(i, 1);
            }
        }
        
        // Continue animation if particles exist
        if (canvasParticles.length > 0) {
            requestAnimationFrame(animateCanvasParticles);
        } else {
            animationLoopRunning = false;
        }
    }
    
    /**
     * Creates various particle effects at the specified position
     * @param {number} x - The x-coordinate of the effect center
     * @param {number} y - The y-coordinate of the effect center
     * @param {number} row - The row index of the cell
     * @param {number} col - The column index of the cell
     */
    function createParticleEffects(x, y, row, col) {
        // Calculate color based on position in the grid to match the gradient
        const hueBase = 240 + ((row + col) / (gridSize * 2 - 2)) * 60; // Blue to purple range
        
        // Create regular particles
        createParticles(x, y, particlesPerClick, hueBase);
        
        // Create smoke particles
        createSmokeParticles(x, y, smokeParticlesPerClick, hueBase);
        
        // Create glow effects
        createGlowEffects(x, y, glowEffectsPerClick, hueBase);
        
        // Create sparkle particles
        createSparkleParticles(x, y, sparkleParticlesPerClick, hueBase);
        
        // Create ripple effects
        createRippleEffects(x, y, rippleEffectsPerClick, hueBase);
    }
    
    /**
     * Creates regular particles
     * @param {number} x - The x-coordinate of the effect center
     * @param {number} y - The y-coordinate of the effect center
     * @param {number} count - The number of particles to create
     * @param {number} hueBase - The base hue value for the particles
     */
    function createParticles(x, y, count, hueBase) {
        // Get the container's position to calculate relative coordinates
        const container = document.querySelector('.container');
        const containerRect = container.getBoundingClientRect();
        
        // Calculate position relative to the particles container
        const relativeX = x - containerRect.left;
        const relativeY = y - containerRect.top;
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            // Random size between 2px and 6px
            const size = Math.random() * 4 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Position at the center of the clicked cell using relative coordinates
            particle.style.left = `${relativeX}px`;
            particle.style.top = `${relativeY}px`;
            
            // Random direction
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 100 + 50;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            // Set custom properties for the animation
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            
            // Random color variation based on position
            const hue = hueBase + Math.random() * 30 - 15;
            const saturation = Math.floor(Math.random() * 30) + 70; // 70-100%
            const lightness = Math.floor(Math.random() * 20) + 50; // 50-70%
            particle.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            particle.style.boxShadow = `0 0 ${size * 2}px ${size}px hsla(${hue}, ${saturation}%, ${lightness}%, 0.7)`;
            
            // Animation duration between 0.5s and 1.5s
            const duration = Math.random() + 0.5;
            particle.style.animation = `particle-fade ${duration}s ease-out forwards`;
            
            // Add to container and remove after animation
            particlesContainer.appendChild(particle);
            setTimeout(() => {
                particlesContainer.removeChild(particle);
            }, duration * 1000);
        }
    }
    
    /**
     * Creates smoke particles
     * @param {number} x - The x-coordinate of the effect center
     * @param {number} y - The y-coordinate of the effect center
     * @param {number} count - The number of smoke particles to create
     * @param {number} hueBase - The base hue value for the smoke particles
     */
    function createSmokeParticles(x, y, count, hueBase) {
        // Get the container's position to calculate relative coordinates
        const container = document.querySelector('.container');
        const containerRect = container.getBoundingClientRect();
        
        // Calculate position relative to the particles container
        const relativeX = x - containerRect.left;
        const relativeY = y - containerRect.top;
        
        for (let i = 0; i < count; i++) {
            const smoke = document.createElement('div');
            smoke.classList.add('smoke');
            
            // Random size between 20px and 40px
            const size = Math.random() * 20 + 20;
            smoke.style.width = `${size}px`;
            smoke.style.height = `${size}px`;
            
            // Position at the center of the clicked cell using relative coordinates
            smoke.style.left = `${relativeX - size / 2}px`;
            smoke.style.top = `${relativeY - size / 2}px`;
            
            // Random direction with more upward bias
            const angle = Math.random() * Math.PI - Math.PI / 2; // -90° to 90°
            const distance = Math.random() * 100 + 50;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance - 50; // Upward bias
            
            // Set custom properties for the animation
            smoke.style.setProperty('--tx', `${tx}px`);
            smoke.style.setProperty('--ty', `${ty}px`);
            
            // Color variation based on position
            const hue = hueBase + Math.random() * 20 - 10;
            smoke.style.background = `
                radial-gradient(
                    circle at center, 
                    rgba(255, 255, 255, 0.8) 0%, 
                    hsla(${hue}, 70%, 50%, 0.5) 30%, 
                    hsla(${hue}, 70%, 30%, 0.2) 70%, 
                    transparent 100%
                )
            `;
            
            // Animation duration between 1s and 2s
            const duration = Math.random() + 1;
            smoke.style.animation = `smoke-rise ${duration}s ease-out forwards`;
            
            // Add to container and remove after animation
            particlesContainer.appendChild(smoke);
            setTimeout(() => {
                particlesContainer.removeChild(smoke);
            }, duration * 1000);
        }
    }
    
    /**
     * Creates glow effects
     * @param {number} x - The x-coordinate of the effect center
     * @param {number} y - The y-coordinate of the effect center
     * @param {number} count - The number of glow effects to create
     * @param {number} hueBase - The base hue value for the glow effects
     */
    function createGlowEffects(x, y, count, hueBase) {
        // Get the container's position to calculate relative coordinates
        const container = document.querySelector('.container');
        const containerRect = container.getBoundingClientRect();
        
        // Calculate position relative to the particles container
        const relativeX = x - containerRect.left;
        const relativeY = y - containerRect.top;
        
        for (let i = 0; i < count; i++) {
            const glow = document.createElement('div');
            glow.classList.add('glow');
            
            // Random size between 10px and 30px
            const size = Math.random() * 20 + 10;
            glow.style.width = `${size}px`;
            glow.style.height = `${size}px`;
            
            // Position at the center of the clicked cell using relative coordinates
            glow.style.left = `${relativeX - size / 2}px`;
            glow.style.top = `${relativeY - size / 2}px`;
            
            // Color variation based on position
            const hue = hueBase + Math.random() * 20 - 10;
            glow.style.boxShadow = `0 0 ${size * 2}px ${size}px hsla(${hue}, 80%, 60%, 0.7)`;
            
            // Animation duration between 0.7s and 1.2s
            const duration = Math.random() * 0.5 + 0.7;
            glow.style.animation = `glow-pulse ${duration}s ease-out forwards`;
            
            // Add to container and remove after animation
            particlesContainer.appendChild(glow);
            setTimeout(() => {
                particlesContainer.removeChild(glow);
            }, duration * 1000);
        }
    }
    
    /**
     * Creates sparkle particles
     * @param {number} x - The x-coordinate of the effect center
     * @param {number} y - The y-coordinate of the effect center
     * @param {number} count - The number of sparkle particles to create
     * @param {number} hueBase - The base hue value for the sparkle particles
     */
    function createSparkleParticles(x, y, count, hueBase) {
        // Get the container's position to calculate relative coordinates
        const container = document.querySelector('.container');
        const containerRect = container.getBoundingClientRect();
        
        // Calculate position relative to the particles container
        const relativeX = x - containerRect.left;
        const relativeY = y - containerRect.top;
        
        for (let i = 0; i < count; i++) {
            const sparkle = document.createElement('div');
            sparkle.classList.add('particle');
            
            // Very small size for sparkles
            const size = Math.random() * 2 + 1;
            sparkle.style.width = `${size}px`;
            sparkle.style.height = `${size}px`;
            
            // Random position around the clicked point
            const radius = Math.random() * 50;
            const angle = Math.random() * Math.PI * 2;
            const sparkleX = relativeX + Math.cos(angle) * radius;
            const sparkleY = relativeY + Math.sin(angle) * radius;
            
            sparkle.style.left = `${sparkleX}px`;
            sparkle.style.top = `${sparkleY}px`;
            
            // Bright color
            const hue = hueBase + Math.random() * 30 - 15;
            sparkle.style.backgroundColor = `hsl(${hue}, 100%, 80%)`;
            sparkle.style.boxShadow = `0 0 ${size * 3}px ${size * 2}px hsla(${hue}, 100%, 70%, 0.9)`;
            
            // Animation duration between 0.3s and 0.8s
            const duration = Math.random() * 0.5 + 0.3;
            sparkle.style.animation = `sparkle ${duration}s ease-in-out infinite`;
            
            // Add to container and remove after some time
            particlesContainer.appendChild(sparkle);
            setTimeout(() => {
                particlesContainer.removeChild(sparkle);
            }, Math.random() * 1000 + 500);
        }
    }
    
    /**
     * Creates ripple effects
     * @param {number} x - The x-coordinate of the effect center
     * @param {number} y - The y-coordinate of the effect center
     * @param {number} count - The number of ripple effects to create
     * @param {number} hueBase - The base hue value for the ripple effects
     */
    function createRippleEffects(x, y, count, hueBase) {
        // Get the container's position to calculate relative coordinates
        const container = document.querySelector('.container');
        const containerRect = container.getBoundingClientRect();
        
        // Calculate position relative to the particles container
        const relativeX = x - containerRect.left;
        const relativeY = y - containerRect.top;
        
        for (let i = 0; i < count; i++) {
            const ripple = document.createElement('div');
            ripple.style.position = 'absolute';
            ripple.style.left = `${relativeX}px`;
            ripple.style.top = `${relativeY}px`;
            ripple.style.width = '10px';
            ripple.style.height = '10px';
            ripple.style.borderRadius = '50%';
            
            // Color based on position
            const hue = hueBase + Math.random() * 20 - 10;
            ripple.style.border = `5px solid hsla(${hue}, 80%, 60%, 0.7)`;
            
            // Animation
            const duration = Math.random() * 0.5 + 0.8;
            ripple.style.animation = `ripple ${duration}s ease-out forwards`;
            
            // Add to container and remove after animation
            particlesContainer.appendChild(ripple);
            setTimeout(() => {
                particlesContainer.removeChild(ripple);
            }, duration * 1000);
        }
    }
    
    /**
     * Returns a randomly selected animation style object for cell rotation or flipping.
     * The returned object contains an `animation` property with a CSS animation string chosen from a set of predefined rotation, flip, spin, and pulse effects.
     * @return {{animation: string}} An object specifying the animation style to apply.
     */
    function getRandomRotationStyle() {
        const animations = [
            { animation: 'rotate-scale 0.8s forwards' },
            { animation: 'rotate-scale 1s reverse forwards' },
            { animation: 'rotate-scale 1.2s alternate forwards' },
            { animation: 'flip-in 0.7s forwards' },
            { animation: 'spin-out 1s forwards, flip-in 0.5s 1s forwards' },
            { animation: 'pulse 0.5s 2 forwards, rotate-scale 1s 1s forwards' }
        ];
        
        const randomIndex = Math.floor(Math.random() * animations.length);
        return animations[randomIndex];
    }
    
    /**
     * Generates a random semi-transparent HSLA color within the blue to purple hue range.
     * @param {number} row - The row index of the cell
     * @param {number} col - The column index of the cell
     * @return {string} An HSLA color string with hue between 240–300, saturation 40–70%, lightness 30–50%, and alpha 0.2–0.6.
     */
    function getGradientColor(row, col) {
        // Calculate hue based on position in the grid
        // This ensures the colors flow properly across the grid
        const hueBase = 240; // Blue base
        const hueRange = 60; // Up to purple
        
        // Normalize position to 0-1 range
        const normalizedPos = (row + col) / (gridSize * 2 - 2);
        
        // Calculate final hue
        const hue = hueBase + normalizedPos * hueRange;
        
        // Add some randomness to saturation and lightness
        const saturation = Math.floor(Math.random() * 20) + 60; // 60-80%
        const lightness = Math.floor(Math.random() * 15) + 35; // 35-50%
        const alpha = 0.9; // High alpha for better visibility
        
        return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
    }
    
    /**
     * Checks if all grid cells are flipped and, if so, applies a pulsing animation to the grid container.
     */
    function checkAllFlipped() {
        const allFlipped = cells.every(cell => cell.classList.contains('flipped'));
        if (allFlipped) {
            // Add a pulsing effect to the entire grid when all cells are flipped
            gridContainer.style.animation = 'pulse 2s infinite';
            
            // Create a special completion effect
            createCompletionEffect();
        } else {
            // Remove animation if not all cells are flipped
            gridContainer.style.animation = '';
        }
    }
    
    /**
     * Creates a special effect when all cells are flipped
     */
    function createCompletionEffect() {
        // Get the container dimensions
        const container = document.querySelector('.container');
        const rect = container.getBoundingClientRect();
        
        // Create a central burst of particles
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create many particles in a circular burst
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 150 + 50;
                const x = centerX + Math.cos(angle) * (distance / 4);
                const y = centerY + Math.sin(angle) * (distance / 4);
                
                // Create particle with a random hue in the purple range
                const hue = Math.random() * 60 + 240;
                createParticles(x, y, 3, hue);
                
                if (i % 10 === 0) {
                    createGlowEffects(x, y, 1, hue);
                }
                
                if (i % 20 === 0) {
                    createRippleEffects(x, y, 1, hue);
                }
            }, i * 20); // Stagger the creation for a more dynamic effect
        }
        
        // Create floating elements that drift around
        createFloatingElements();
        
        // Create a grand finale canvas effect
        createGrandFinaleEffect(centerX, centerY);
    }
    
    /**
     * Creates a spectacular grand finale effect on the canvas
     * @param {number} centerX - The x-coordinate of the center
     * @param {number} centerY - The y-coordinate of the center
     */
    function createGrandFinaleEffect(centerX, centerY) {
        // Create a vortex of particles
        for (let i = 0; i < 200; i++) {
            setTimeout(() => {
                const angle = (i / 200) * Math.PI * 10; // Spiral pattern
                const distance = i * 0.5;
                const x = centerX + Math.cos(angle) * distance;
                const y = centerY + Math.sin(angle) * distance;
                
                // Create canvas particles with special properties
                const hue = (i / 200) * 60 + 240; // Gradual color change
                
                canvasParticles.push({
                    x,
                    y,
                    size: Math.random() * 4 + 2,
                    speedX: Math.cos(angle + Math.PI/2) * 2,
                    speedY: Math.sin(angle + Math.PI/2) * 2,
                    life: Math.random() * 100 + 100,
                    fullLife: 200,
                    color: `hsla(${hue}, 90%, 60%, 0.8)`,
                    glow: true
                });
                
                // Start animation if not running
                if (!animationLoopRunning) {
                    animationLoopRunning = true;
                    animateCanvasParticles();
                }
            }, i * 10);
        }
        
        // Create a shockwave effect
        setTimeout(() => {
            createShockwaveEffect(centerX, centerY);
        }, 2000);
    }
    
    /**
     * Creates a shockwave effect on the canvas
     * @param {number} x - The x-coordinate of the center
     * @param {number} y - The y-coordinate of the center
     */
    function createShockwaveEffect(x, y) {
        let radius = 10;
        const maxRadius = Math.max(canvas.width, canvas.height);
        const speed = 5;
        let opacity = 1;
        
        function drawShockwave() {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.lineWidth = 15;
            ctx.strokeStyle = `hsla(260, 80%, 50%, ${opacity})`;
            ctx.stroke();
            
            // Create trailing shockwaves
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.8, 0, Math.PI * 2);
            ctx.lineWidth = 8;
            ctx.strokeStyle = `hsla(280, 90%, 60%, ${opacity * 0.7})`;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
            ctx.lineWidth = 4;
            ctx.strokeStyle = `hsla(300, 100%, 70%, ${opacity * 0.5})`;
            ctx.stroke();
            ctx.restore();
            
            // Update for next frame
            radius += speed;
            opacity = 1 - (radius / maxRadius);
            
            if (opacity > 0) {
                requestAnimationFrame(drawShockwave);
            }
        }
        
        drawShockwave();
    }
    
    /**
     * Creates floating decorative elements after completion
     */
    function createFloatingElements() {
        const container = document.querySelector('.container');
        const rect = container.getBoundingClientRect();
        
        for (let i = 0; i < 15; i++) {
            const floater = document.createElement('div');
            floater.style.position = 'absolute';
            floater.style.pointerEvents = 'none';
            
            // Random size
            const size = Math.random() * 20 + 10;
            floater.style.width = `${size}px`;
            floater.style.height = `${size}px`;
            
            // Random position within container
            const x = Math.random() * rect.width;
            const y = Math.random() * rect.height;
            floater.style.left = `${x}px`;
            floater.style.top = `${y}px`;
            
            // Random color in our theme
            const hue = Math.random() * 60 + 240;
            floater.style.backgroundColor = `hsla(${hue}, 80%, 60%, 0.2)`;
            floater.style.borderRadius = '50%';
            floater.style.boxShadow = `0 0 ${size}px ${size/2}px hsla(${hue}, 80%, 60%, 0.3)`;
            
            // Random float animation
            const floatY = (Math.random() - 0.5) * 50;
            const floatR = (Math.random() - 0.5) * 180;
            floater.style.setProperty('--float-y', `${floatY}px`);
            floater.style.setProperty('--float-r', `${floatR}deg`);
            
            const duration = Math.random() * 3 + 2;
            floater.style.animation = `float ${duration}s ease-in-out infinite`;
            
            // Add to container
            particlesContainer.appendChild(floater);
        }
    }
    
    // Initialize the grid when the DOM is loaded
    initializeGrid();
    
    // Apply the gradient colors to each cell after a short delay
    setTimeout(() => {
        cells.forEach((cell, index) => {
            const row = Math.floor(index / gridSize);
            const col = index % gridSize;
            
            // Set the gradient color for this cell's ::before element
            cell.style.setProperty('--cell-color', getGradientColor(row, col));
            
            // Apply the CSS variable to the ::before element
            const style = document.createElement('style');
            style.textContent = `
                #${cell.id}::before {
                    background: var(--cell-color);
                }
            `;
            document.head.appendChild(style);
            
            // Initialize cell state
            cell.dataset.animating = 'false';
        });
    }, 100);
    
    // Fix for any browser-specific issues with 3D transforms
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('cell')) {
            // Force repaint to ensure proper rendering
            e.target.style.transform = e.target.style.transform;
        }
    }, true);
}); 