// JavaScript Document

// Neural Network Background Animation
const canvas = document.getElementById('neural-bg');
const ctx = canvas ? canvas.getContext('2d') : null;
let nodes = [];
let mouse = { x: 0, y: 0 };

if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 3 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (!canvas) return;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }

    draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00ffff';
        ctx.fill();
    }
}

function init() {
    nodes = [];
    if (!canvas) return;
    for (let i = 0; i < 100; i++) {
        nodes.push(new Node(
            Math.random() * canvas.width,
            Math.random() * canvas.height
        ));
    }
}

function connectNodes() {
    if (!ctx) return;
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.strokeStyle = `rgba(0, 255, 255, ${1 - distance / 150})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }
}

let animId = null;

// Provide a global controller to allow start/stop by other scripts
window.neuralControl = window.neuralControl || {
    enabled: true,
    setEnabled(enabled) {
        this.enabled = !!enabled;
        if (this.enabled) startAnimation();
        else stopAnimation();
    },
    isEnabled() { return !!this.enabled; }
};

function animate() {
    if (!window.neuralControl.enabled) {
        if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
        animId = null;
        return;
    }

    if (!ctx || !canvas) {
        animId = requestAnimationFrame(animate);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    nodes.forEach(node => {
        node.update();
        node.draw();
    });

    connectNodes();
    animId = requestAnimationFrame(animate);
}

function startAnimation() {
    if (!canvas || !ctx) return;
    if (animId) return;
    init();
    window.neuralControl.enabled = true;
    animId = requestAnimationFrame(animate);
}

function stopAnimation() {
    window.neuralControl.enabled = false;
    if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
    }
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// Initialize and start animation (unless preference elsewhere will change it)
init();
startAnimation();

// Handle window resize
window.addEventListener('resize', () => {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init();
});

// Mouse move effect
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// Mobile menu toggle (guardado para evitar errores si no existen los elementos)
(function() {
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
})();

// Smooth scroll
// NOTE: skip SPA hash routes (e.g. "#/slug") and links that use data-page (the SPA)
// Also protect document.querySelector against invalid selectors
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href.length === 1) return;

        // If this is a SPA route or a data-page link, don't intercept
        if (href.startsWith('#/') || this.hasAttribute('data-page')) return;

        // Normal in-page anchor scrolling
        e.preventDefault();
        try {
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } catch (err) {
            // invalid selector - ignore
        }
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    // Fade in sections
    const sections = document.querySelectorAll('.fade-in');
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.8) {
            section.classList.add('visible');
        }
    });
});

// Form submission
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Message sent! (This is a demo)');
    });
}

// Dropdown behavior (calculadora)
(function () {
    const dropdown = document.getElementById('calc-dropdown');
    if (!dropdown) return;
    const toggle = dropdown.querySelector('.drop-toggle');

    // Hacer toggle en móvil (o pantallas pequeñas)
    toggle.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            e.preventDefault();
            dropdown.classList.toggle('open');
            const expanded = dropdown.classList.contains('open');
            toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        }
    });

    // Soporte teclado (Enter / Space)
    toggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            dropdown.classList.toggle('open');
            const expanded = dropdown.classList.contains('open');
            toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        }
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown')) {
            if (dropdown.classList.contains('open')) {
                dropdown.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        }
    });

    // Cerrar al redimensionar cuando volvemos a desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && dropdown.classList.contains('open')) {
            dropdown.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        }
    });
})();