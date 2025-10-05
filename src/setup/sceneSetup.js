import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';

export function setupScene() {
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 2.8;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Post-processing setup for bloom effect
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        3.4,  // strength - noticeable bloom without flattening cores
        0.85,  // radius - keep glow tight so stars stay defined
        0.0   // threshold - keep bloom active even on mid brights
    );
    composer.addPass(bloomPass);

    // Bokeh (depth of field blur) pass
    const bokehPass = new BokehPass(scene, camera, {
        focus: 1000,
        aperture: 0, // Start with 0 aperture
        maxblur: 0
    });
    bokehPass.enabled = true; // Always enabled but controlled by strength
    composer.addPass(bokehPass);

    // Camera position - zoomed in closer to stars
    camera.position.set(0, 0, 1700);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 100;
    controls.maxDistance = 2500;

    return { scene, camera, renderer, composer, controls, bloomPass, bokehPass };
}

export function setupWindowResize(camera, renderer, composer) {
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    });
}
