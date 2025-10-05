import * as THREE from 'three';

// Create star texture with diffraction spikes/rays - completely smooth fadeout
// Random seed parameter for variations
export function createStarTexture(seed = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const centerX = 128;
    const centerY = 128;

    const random = (min = 0, max = 1) => {
        seed = (seed * 9301 + 49297) % 233280;
        return min + (seed / 233280) * (max - min);
    };

    ctx.clearRect(0, 0, 256, 256);
    ctx.globalCompositeOperation = 'lighter';

    const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, random(18, 28));
    coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    coreGradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.35)');
    coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = coreGradient;
    ctx.fillRect(0, 0, 256, 256);

    const haloGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 110);
    haloGradient.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    haloGradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.18)');
    haloGradient.addColorStop(0.55, 'rgba(255, 255, 255, 0.05)');
    haloGradient.addColorStop(0.85, 'rgba(255, 255, 255, 0.015)');
    haloGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = haloGradient;
    ctx.fillRect(0, 0, 256, 256);

    const lobeCount = Math.floor(random(3, 7));
    for (let i = 0; i < lobeCount; i++) {
        const angle = random(0, Math.PI * 2);
        const scaleX = random(0.65, 1.35);
        const scaleY = random(1.1, 2.1);
        const radius = random(28, 42);

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        ctx.scale(scaleX, scaleY);
        ctx.shadowColor = 'rgba(255, 255, 255, 1)';
        ctx.shadowBlur = random(35, 60);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + random(0.08, 0.18) + ')';
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    ctx.shadowBlur = 0;
    const speckCount = 80;
    for (let i = 0; i < speckCount; i++) {
        const angle = random(0, Math.PI * 2);
        const distance = Math.pow(random(0, 1), 0.5) * 110;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        ctx.beginPath();
        ctx.arc(x, y, random(1.2, 3.1), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + random(0.01, 0.04) + ')';
        ctx.fill();
    }

    ctx.globalCompositeOperation = 'destination-in';
    const alphaMask = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 120);
    alphaMask.addColorStop(0, 'rgba(0, 0, 0, 1)');
    alphaMask.addColorStop(0.78, 'rgba(0, 0, 0, 0.4)');
    alphaMask.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = alphaMask;
    ctx.fillRect(0, 0, 256, 256);
    ctx.globalCompositeOperation = 'source-over';

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// Create simple circular texture without spikes (for dust)
export function createCircularTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const centerX = 64;
    const centerY = 64;

    ctx.clearRect(0, 0, 128, 128);

    // Simple radial gradient with very smooth falloff
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.15)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.05)');
    gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.01)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}
