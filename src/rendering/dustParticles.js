import * as THREE from 'three';
import { createCircularTexture } from './textureFactory.js';

// Create ambient dust particles for atmospheric depth
export function createAmbientDust(scene) {
    const dustGeometry = new THREE.BufferGeometry();
    const dustCount = 5000;
    const dustPositions = [];
    const dustColors = [];

    for (let i = 0; i < dustCount; i++) {
        // Random positions in a larger sphere
        const radius = 500 + Math.random() * 1500;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        dustPositions.push(x, y, z);

        // Very faint bluish-purple dust
        const colorVariation = Math.random() * 0.3;
        dustColors.push(
            0.3 + colorVariation,
            0.2 + colorVariation,
            0.6 + colorVariation
        );
    }

    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    dustGeometry.setAttribute('color', new THREE.Float32BufferAttribute(dustColors, 3));

    // Create simple circular texture for dust (no spikes)
    const dustTexture = createCircularTexture();
    const dustMaterial = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        map: dustTexture
    });

    const dustParticles = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dustParticles);
}
