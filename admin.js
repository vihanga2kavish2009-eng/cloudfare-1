// Admin authentication logic
const ADMIN_PASSWORD = "mysecretpassword123"; // Simple fixed password

const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('admin-password');
const loginError = document.getElementById('login-error');
const loginContainer = document.getElementById('login-container');
const adminMain = document.getElementById('admin-main');

// Check if already logged in via session
function checkAuth() {
    if (sessionStorage.getItem('vk_admin_auth') === 'true') {
        loginContainer.style.display = 'none';
        adminMain.style.display = 'block';
    }
}

// Handle login submission
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (passwordInput.value === "admin123") {
            sessionStorage.setItem('vk_admin_auth', 'true');
            loginContainer.style.display = 'none';
            adminMain.style.display = 'block';
            loginError.style.display = 'none';
            passwordInput.value = ''; // clear input
        } else {
            loginError.style.display = 'block';
            loginError.textContent = "Incorrect password! Hint: it is 'admin123'";
        }
    });
}

// Admin functionality for adding links to LocalStorage

const form = document.getElementById('add-link-form');
const titleInput = document.getElementById('link-title');
const urlInput = document.getElementById('link-url');
const descInput = document.getElementById('link-desc');
const linksContainer = document.getElementById('admin-links-container');

// Load existing links
let myLinks = JSON.parse(localStorage.getItem('vk_private_links')) || [];

function renderAdminLinks() {
    linksContainer.innerHTML = '';

    if (myLinks.length === 0) {
        linksContainer.innerHTML = '<p style="text-align:center; color: var(--text-secondary);">No custom links added yet.</p>';
        return;
    }

    myLinks.forEach((link, index) => {
        const linkElement = document.createElement('div');
        linkElement.className = 'glass-card link-item';
        linkElement.innerHTML = `
            <div class="link-info">
                <h3>${link.title}</h3>
                <a href="${link.url}" target="_blank">${link.url}</a>
                <p style="margin-top: 0.5rem; color: var(--text-secondary); font-size: 0.9rem;">${link.desc}</p>
            </div>
            <button class="btn btn-danger" onclick="deleteLink(${index})" style="padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;">Delete</button>
        `;
        linksContainer.appendChild(linkElement);
    });
}

// Add new link
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const newLink = {
        title: titleInput.value.trim(),
        url: urlInput.value.trim(),
        desc: descInput.value.trim() || 'Custom private link'
    };

    myLinks.unshift(newLink); // Add to beginning
    localStorage.setItem('vk_private_links', JSON.stringify(myLinks));

    // Reset form
    form.reset();

    // Re-render
    renderAdminLinks();
});

// Delete link globally available
window.deleteLink = function (index) {
    if (confirm('Are you sure you want to delete this link?')) {
        myLinks.splice(index, 1);
        localStorage.setItem('vk_private_links', JSON.stringify(myLinks));
        renderAdminLinks();
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    renderAdminLinks();
});

// Reuse the cool background from the main site
const initThreeJS = () => {
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const particlesCount = 100; // Less for admin
    const particles = [];
    const particlesGeometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(particlesCount * 3);
    const colorsArray = new Float32Array(particlesCount * 3);

    const linesMaterial = new THREE.LineBasicMaterial({
        color: 0x6366f1, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending
    });

    const particleGroup = new THREE.Group();
    scene.add(particleGroup);

    for (let i = 0; i < particlesCount; i++) {
        const x = (Math.random() - 0.5) * 20;
        const y = (Math.random() - 0.5) * 20;
        const z = (Math.random() - 0.5) * 15;

        posArray[i * 3] = x; posArray[i * 3 + 1] = y; posArray[i * 3 + 2] = z;

        colorsArray[i * 3] = 0.38; colorsArray[i * 3 + 1] = 0.4; colorsArray[i * 3 + 2] = 0.94;

        particles.push({
            x: x, y: y, z: z,
            vx: (Math.random() - 0.5) * 0.01,
            vy: (Math.random() - 0.5) * 0.01,
            vz: (Math.random() - 0.5) * 0.01
        });
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

    const dotsMaterial = new THREE.PointsMaterial({
        size: 0.1, vertexColors: true, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, dotsMaterial);
    particleGroup.add(particlesMesh);

    camera.position.z = 8;

    let linesMesh;

    const animate = () => {
        requestAnimationFrame(animate);
        const positions = particlesMesh.geometry.attributes.position.array;
        const linePositions = [];

        for (let i = 0; i < particlesCount; i++) {
            let p = particles[i];
            p.x += p.vx; p.y += p.vy; p.z += p.vz;

            if (p.x > 10 || p.x < -10) p.vx *= -1;
            if (p.y > 10 || p.y < -10) p.vy *= -1;
            if (p.z > 8 || p.z < -8) p.vz *= -1;

            positions[i * 3] = p.x; positions[i * 3 + 1] = p.y; positions[i * 3 + 2] = p.z;

            for (let j = i + 1; j < particlesCount; j++) {
                let p2 = particles[j];
                let distSq = (p.x - p2.x) ** 2 + (p.y - p2.y) ** 2 + (p.z - p2.z) ** 2;
                if (distSq < 4.0) {
                    linePositions.push(p.x, p.y, p.z);
                    linePositions.push(p2.x, p2.y, p2.z);
                }
            }
        }

        particlesMesh.geometry.attributes.position.needsUpdate = true;
        if (linesMesh) particleGroup.remove(linesMesh);
        if (linePositions.length > 0) {
            const lineGeo = new THREE.BufferGeometry();
            lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
            linesMesh = new THREE.LineSegments(lineGeo, linesMaterial);
            particleGroup.add(linesMesh);
        }

        particleGroup.rotation.y += 0.001;
        renderer.render(scene, camera);
    };

    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
});
