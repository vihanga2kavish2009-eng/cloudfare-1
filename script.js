
// Initialize GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// --- Three.js Particle Plexus Background ---
const initThreeJS = () => {
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Particles array
    const particlesCount = 200; // Fewer particles for the connected line effect to not kill performance
    const particles = [];

    const particlesGeometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(particlesCount * 3);
    const colorsArray = new Float32Array(particlesCount * 3);

    // Line material
    const linesMaterial = new THREE.LineBasicMaterial({
        color: 0x6366f1,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending
    });

    // Group to hold particles and lines
    const particleGroup = new THREE.Group();
    scene.add(particleGroup);

    for (let i = 0; i < particlesCount; i++) {
        // Spread particles
        const x = (Math.random() - 0.5) * 20;
        const y = (Math.random() - 0.5) * 20;
        const z = (Math.random() - 0.5) * 15;

        posArray[i * 3] = x;
        posArray[i * 3 + 1] = y;
        posArray[i * 3 + 2] = z;

        // Add subtle colors (blue, purple, pink hues)
        const randHue = Math.random();
        if (randHue > 0.6) {
            colorsArray[i * 3] = 0.38; // R
            colorsArray[i * 3 + 1] = 0.4; // G
            colorsArray[i * 3 + 2] = 0.94; // B
        } else if (randHue > 0.3) {
            colorsArray[i * 3] = 0.65; // R
            colorsArray[i * 3 + 1] = 0.33; // G
            colorsArray[i * 3 + 2] = 0.96; // B
        } else {
            colorsArray[i * 3] = 0.92; // R
            colorsArray[i * 3 + 1] = 0.28; // G
            colorsArray[i * 3 + 2] = 0.6; // B
        }

        // Store velocity and exact position for dynamic movement
        particles.push({
            x: x, y: y, z: z,
            vx: (Math.random() - 0.5) * 0.02,
            vy: (Math.random() - 0.5) * 0.02,
            vz: (Math.random() - 0.5) * 0.02
        });
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

    // Create sprites for particles (glow effect)
    const particleTexture = createCircularTexture();
    const dotsMaterial = new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        map: particleTexture,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, dotsMaterial);
    particleGroup.add(particlesMesh);

    camera.position.z = 8;

    // Mouse interation variables
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - window.innerWidth / 2) * 0.002;
        mouseY = (event.clientY - window.innerHeight / 2) * 0.002;
    });

    // We will recreate line geometry each frame
    let linesMesh;

    // Helper to make circular particles instead of squares
    function createCircularTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(16, 16, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        return new THREE.CanvasTexture(canvas);
    }

    // Animation Loop
    const animate = () => {
        requestAnimationFrame(animate);

        targetX = mouseX * 2;
        targetY = mouseY * 2;

        // Update particle positions based on velocity
        const positions = particlesMesh.geometry.attributes.position.array;

        // Arrays for lines
        const linePositions = [];

        for (let i = 0; i < particlesCount; i++) {
            let p = particles[i];

            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;

            // Bounce off boundaries subtly
            if (p.x > 10 || p.x < -10) p.vx *= -1;
            if (p.y > 10 || p.y < -10) p.vy *= -1;
            if (p.z > 8 || p.z < -8) p.vz *= -1;

            positions[i * 3] = p.x;
            positions[i * 3 + 1] = p.y;
            positions[i * 3 + 2] = p.z;

            // Check connections with other nearby particles
            for (let j = i + 1; j < particlesCount; j++) {
                let p2 = particles[j];
                let dx = p.x - p2.x;
                let dy = p.y - p2.y;
                let dz = p.z - p2.z;

                let distSq = dx * dx + dy * dy + dz * dz;

                // If particles are close, draw a line between them
                if (distSq < 4.0) {
                    linePositions.push(p.x, p.y, p.z);
                    linePositions.push(p2.x, p2.y, p2.z);
                }
            }

            // Mouse interaction: push points slightly away from mouse
            let mDx = p.x - (mouseX * 5);
            let mDy = p.y - (-mouseY * 5);
            let mDist = Math.sqrt(mDx * mDx + mDy * mDy);

            if (mDist < 3.0) {
                p.vx += mDx * 0.0005;
                p.vy += mDy * 0.0005;
            }
        }

        particlesMesh.geometry.attributes.position.needsUpdate = true;

        // Recreate lines
        if (linesMesh) particleGroup.remove(linesMesh);

        if (linePositions.length > 0) {
            const lineGeo = new THREE.BufferGeometry();
            lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
            linesMesh = new THREE.LineSegments(lineGeo, linesMaterial);
            particleGroup.add(linesMesh);
        }

        // Parallax effect
        particleGroup.rotation.y += 0.001;
        particleGroup.position.x += (targetX - particleGroup.position.x) * 0.05;
        particleGroup.position.y += (-targetY - particleGroup.position.y) * 0.05;

        renderer.render(scene, camera);
    };

    animate();

    // Handle Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

// Initialize ThreeJS when loaded
document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();

    // --- Load Admin Links ---
    const privateLinksContainer = document.getElementById('private-links-grid');
    if (privateLinksContainer) {
        const myLinks = JSON.parse(localStorage.getItem('vk_private_links')) || [];
        if (myLinks.length === 0) {
            privateLinksContainer.innerHTML = '<p style="text-align:center; color: var(--text-secondary); width: 100%; grid-column: 1 / -1;">No custom links added yet. Go to the Admin Panel to add some.</p>';
        } else {
            myLinks.forEach(link => {
                const card = document.createElement('div');
                card.className = 'project-card glass-card';
                card.innerHTML = `
                    <div class="project-info" style="height: 100%;">
                        <h3>${link.title}</h3>
                        <p>${link.desc}</p>
                        <a href="${link.url}" target="_blank" class="view-link" style="margin-top: auto;">Visit Website →</a>
                    </div>
                `;
                privateLinksContainer.appendChild(card);
            });
        }
    }

    // --- GSAP Animations ---

    // Hero Section Initial Animation
    const tl = gsap.timeline();
    tl.from('.greeting', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.5 })
        .from('.title', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
        .from('.subtitle', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
        .from('.description', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
        .from('.cta-buttons', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6');

    // Scroll Animations for Sections
    const sections = gsap.utils.toArray('.section-scroll');

    sections.forEach((sec, i) => {
        if (i === 0) return; // Skip home section

        gsap.from(sec.querySelectorAll('.section-title, .glass-card, .stat-box, .about-text'), {
            scrollTrigger: {
                trigger: sec,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: 'power3.out'
        });
    });

    // Animate skillfully bar fills on scroll
    gsap.from('.fill', {
        scrollTrigger: {
            trigger: '.skills',
            start: 'top 75%'
        },
        width: 0,
        duration: 1.5,
        stagger: 0.1,
        ease: 'power3.out'
    });

    // --- Preloader Logic ---
    const preloader = document.getElementById('preloader');
    const loadProgress = document.querySelector('.loading-progress');

    // Simulate loading
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 100) progress = 100;
        if (loadProgress) loadProgress.style.width = `${progress}%`;

        if (progress === 100) {
            clearInterval(interval);
            setTimeout(() => {
                if (preloader) {
                    preloader.style.opacity = '0';
                    setTimeout(() => preloader.style.visibility = 'hidden', 500);
                }
            }, 300); // Tiny pause at 100%
        }
    }, 150);

    // --- 3D Tilt Effect on Glass Cards ---
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element
            const y = e.clientY - rect.top;  // y position within the element

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg rotation
            const rotateY = ((x - centerX) / centerX) * 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            card.style.transition = 'transform 0.5s ease';
        });

        card.addEventListener('mouseenter', () => {
            card.style.transition = 'none'; // Remove transition for smooth tracking
        });
    });

});
