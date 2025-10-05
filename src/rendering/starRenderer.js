import * as THREE from 'three';
import { getColorNameFromRGB } from '../utils/colorUtils.js';
import { createStarTexture } from './textureFactory.js';
import { createAmbientDust } from './dustParticles.js';

// Load and visualize stars
let starPoints;
let starData = [];

export async function loadStars(scene) {
    try {
        const response = await fetch('bsc5p_stars.json');
        const data = await response.json();

        const positions = [];
        const colors = [];
        const sizes = [];
        const rotations = []; // Random rotation angles for each star

        // Scale factor to fit stars nicely in view (parsecs to scene units)
        const scaleFactor = 5;

        data.forEach(star => {
            // BSC5P already provides 3D coordinates in parsecs
            const { i, n, x, y, z, p, N, K } = star;

            // Skip if no color data
            if (!K) return;

            // Scale positions to fit scene
            positions.push(x * scaleFactor, y * scaleFactor, z * scaleFactor);

            // Use pre-calculated RGB color from BSC5P (based on blackbody radiation)
            const { r, g, b } = K;

            // Calculate brightness metrics (used for both color boost and size)
            const luminosity = N || 1;
            const distance = p || 100;
            const safeDistance = Math.max(0.1, distance);
            const apparentBrightness = luminosity / (safeDistance * safeDistance);
            const brightnessBoost = Math.pow(apparentBrightness + 1, 0.28);
            const emissiveIntensity = THREE.MathUtils.clamp(brightnessBoost * 1.9, 0.6, 4.2);

            // Allow HDR intensity so bloom has something to amplify without washing detail
            colors.push(
                r * emissiveIntensity,
                g * emissiveIntensity,
                b * emissiveIntensity
            );

            const size = THREE.MathUtils.clamp(brightnessBoost * 14 + 5, 5, 55);
            sizes.push(size);

            // Random rotation angle for diffraction spikes (0 to 2π)
            rotations.push(Math.random() * Math.PI * 2);

            // Store star data for later reference
            const colorName = getColorNameFromRGB(r, g, b);
            starData.push({
                id: i,
                name: n,
                position: new THREE.Vector3(x * scaleFactor, y * scaleFactor, z * scaleFactor),
                distance: distance,
                luminosity: luminosity,
                color: new THREE.Color(r, g, b),
                colorName: colorName
            });
        });

        // Create geometry
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        geometry.setAttribute('rotation', new THREE.Float32BufferAttribute(rotations, 1));

        // Create soft star texture without diffraction spikes
        const starTexture = createStarTexture();

        // Custom shader material for rotating point sprites
        const material = new THREE.ShaderMaterial({
            uniforms: {
                pointTexture: { value: starTexture }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                attribute float rotation;
                varying vec3 vColor;
                varying float vRotation;

                void main() {
                    vColor = color;
                    vRotation = rotation;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (400.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                varying float vRotation;

                void main() {
                    vec2 uv = gl_PointCoord;

                    // Rotate UV coordinates around center (0.5, 0.5)
                    vec2 center = vec2(0.5, 0.5);
                    vec2 rotated = uv - center;
                    float s = sin(vRotation);
                    float c = cos(vRotation);
                    rotated = vec2(
                        rotated.x * c - rotated.y * s,
                        rotated.x * s + rotated.y * c
                    );
                    rotated += center;

                    vec4 texColor = texture2D(pointTexture, rotated);
                    gl_FragColor = vec4(vColor * texColor.rgb, texColor.a);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true
        });

        // Create points
        starPoints = new THREE.Points(geometry, material);
        scene.add(starPoints);

        // Add ambient dust/nebula particles for depth
        createAmbientDust(scene);

        // Hide loading indicator
        document.getElementById('loading').style.display = 'none';

        console.log(`Loaded ${data.length} stars from BSC5P catalog`);
    } catch (error) {
        console.error('Error loading stars:', error);
        document.getElementById('loading').textContent = 'Error loading stars';
    }
}

export function getStarPoints() {
    return starPoints;
}

export function getStarData() {
    return starData;
}
