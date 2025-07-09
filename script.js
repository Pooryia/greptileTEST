// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Greptile Web App initialized');
    
    // Get references to DOM elements
    const ctaButton = document.getElementById('cta-button');
    const header = document.querySelector('header');
    const features = document.querySelectorAll('.feature');
    
    // Add event listener to the CTA button
    if (ctaButton) {
        ctaButton.addEventListener('click', () => {
            alert('Thank you for your interest! This is a demo application.');
        });
    }
    
    // Simple scroll effect for header
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // Add animation to features when they come into view
    const animateFeatures = () => {
        features.forEach(feature => {
            const featurePosition = feature.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.3;
            
            if (featurePosition < screenPosition) {
                feature.classList.add('active');
            }
        });
    };
    
    // Call once on load and then on scroll
    animateFeatures();
    window.addEventListener('scroll', animateFeatures);
    
    // Add feature hover effects
    features.forEach(feature => {
        feature.addEventListener('mouseenter', () => {
            feature.classList.add('hover');
        });
        
        feature.addEventListener('mouseleave', () => {
            feature.classList.remove('hover');
        });
    });
    
    // Simple form validation example (if a form is added later)
    const setupFormValidation = () => {
        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                const emailInput = form.querySelector('input[type="email"]');
                if (emailInput && !isValidEmail(emailInput.value)) {
                    e.preventDefault();
                    alert('Please enter a valid email address.');
                }
            });
        }
    };
    
    // Email validation helper
    const isValidEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };
    
    // Call form validation setup
    setupFormValidation();
}); 