import { setupScene, setupWindowResize } from './src/setup/sceneSetup.js';
import { loadStars, getStarPoints, getStarData } from './src/rendering/starRenderer.js';
import { setupStarInteraction, updateStarInfoPosition } from './src/interaction/starInteraction.js';
import { setupDebugPanel } from './src/debug/debugPanel.js';
import { calculateAdaptiveBloomStrength, calculateAdaptiveBloomRadius, calculateAdaptiveBloomThreshold, calculateAdaptiveBlurClose, calculateAdaptiveBlurFar } from './src/utils/bloomUtils.js';

const entryNarratives = [
    {
        context: "The universe expands infinitely in all directions. In this tension between boundless cosmos and bounded creation lies art's quiet defiance: that meaning need not be eternal to matter.",
        focus: "Every work of art remains singular - a finite gesture against the endless void."
    },
    {
        context: "We are finite beings contemplating infinite space, and our art reflects this paradox.",
        focus: "Each piece we create is numbered, limited, mortal - and perhaps all the more precious for it."
    },
    {
        context: "The cosmos offers infinity; art offers the opposite. In a universe without edges, we draw lines. In endless time, we capture moments.",
        focus: "The finite becomes our form of truth."
    },
    {
        context: "Against the infinite canvas of the cosmos, humanity paints in finite strokes.",
        focus: "Every artwork is an island of intention in an ocean without shores."
    }
];

// Entry Animation Controller
function playEntryAnimation() {
    const overlay = document.getElementById('entry-overlay');
    const title = document.getElementById('entry-title');
    const subtitle = document.getElementById('entry-subtitle');
    const infoPanel = document.querySelector('.info-panel');

    if (!overlay) {
        if (infoPanel) {
            infoPanel.classList.add('show');
        }
        return;
    }

    const reveal = (element, delay = 0) => {
        if (!element) {
            return;
        }
        if (delay <= 0) {
            element.classList.add('is-visible');
            return;
        }
        setTimeout(() => element.classList.add('is-visible'), delay);
    };

    if (title && subtitle) {
        const randomIndex = Math.floor(Math.random() * entryNarratives.length);
        const { context, focus } = entryNarratives[randomIndex];
        subtitle.textContent = context;
        title.textContent = focus;
    }

    overlay.classList.add('is-active');
    reveal(subtitle, 160);
    reveal(title, 480);

    const exitDelay = 2400;
    const fallbackTimeout = setTimeout(() => {
        if (infoPanel) {
            infoPanel.classList.add('show');
        }
        if (overlay.parentElement) {
            overlay.remove();
        }
    }, exitDelay + 1200);

    setTimeout(() => {
        overlay.classList.add('is-exiting');
        overlay.addEventListener('animationend', () => {
            clearTimeout(fallbackTimeout);
            if (overlay.parentElement) {
                overlay.remove();
            }
            if (infoPanel) {
                infoPanel.classList.add('show');
            }
        }, { once: true });
    }, exitDelay);
}

// Start entry animation when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', playEntryAnimation);
} else {
    playEntryAnimation();
}

// Initialize scene, camera, renderer, and controls
const { scene, camera, renderer, composer, controls, bloomPass, bokehPass } = setupScene();

// Setup window resize handler
setupWindowResize(camera, renderer, composer);

// Setup star interaction (click handling)
setupStarInteraction(renderer, camera, controls, getStarPoints, getStarData);

// Setup debug panel
const debugPanel = setupDebugPanel(camera, renderer, composer, controls);

// Global toggle function for debug panel
window.toggleDebug = function() {
    const panel = document.getElementById('debug-panel');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
};

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    const distanceToTarget = camera.position.distanceTo(controls.target);
    const zoomRange = Math.max(controls.maxDistance - controls.minDistance, 1);
    const normalizedZoom = Math.min(Math.max((distanceToTarget - controls.minDistance) / zoomRange, 0), 1);
    const eased = Math.pow(normalizedZoom, 1.6);

    const starPoints = getStarPoints();
    if (starPoints) {
        // Ease rotation speed with zoom so close views feel calmer
        const rotationSpeed = (0.00002 + (0.0003 - 0.00002) * eased) * debugPanel.rotationSpeedMultiplier;
        starPoints.rotation.y += rotationSpeed;
    }

    if (bloomPass) {
        if (debugPanel.isBloomStrengthManual) {
            const manualStrength = debugPanel.manualBloomStrength ?? bloomPass.strength;
            bloomPass.strength = manualStrength;
            if (typeof debugPanel.setBloomStrengthDisplay === 'function') {
                debugPanel.setBloomStrengthDisplay(manualStrength);
            }
        } else {
            const adaptiveStrength = calculateAdaptiveBloomStrength(distanceToTarget);
            bloomPass.strength = adaptiveStrength;
            if (typeof debugPanel.setBloomStrengthDisplay === 'function') {
                debugPanel.setBloomStrengthDisplay(adaptiveStrength);
            }
        }

        if (debugPanel.isBloomRadiusManual) {
            const manualRadius = debugPanel.manualBloomRadius ?? bloomPass.radius;
            bloomPass.radius = manualRadius;
            if (typeof debugPanel.setBloomRadiusDisplay === 'function') {
                debugPanel.setBloomRadiusDisplay(manualRadius);
            }
        } else {
            const adaptiveRadius = calculateAdaptiveBloomRadius(distanceToTarget);
            bloomPass.radius = adaptiveRadius;
            if (typeof debugPanel.setBloomRadiusDisplay === 'function') {
                debugPanel.setBloomRadiusDisplay(adaptiveRadius);
            }
        }

        if (debugPanel.isBloomThresholdManual) {
            const manualThreshold = debugPanel.manualBloomThreshold ?? bloomPass.threshold;
            bloomPass.threshold = manualThreshold;
            if (typeof debugPanel.setBloomThresholdDisplay === 'function') {
                debugPanel.setBloomThresholdDisplay(manualThreshold);
            }
        } else {
            const adaptiveThreshold = calculateAdaptiveBloomThreshold(distanceToTarget);
            bloomPass.threshold = adaptiveThreshold;
            if (typeof debugPanel.setBloomThresholdDisplay === 'function') {
                debugPanel.setBloomThresholdDisplay(adaptiveThreshold);
            }
        }
    }

    if (bokehPass) {
        if (debugPanel.blurDirection === 'manual') {
            const manualBlur = debugPanel.manualBlur ?? bokehPass.uniforms.maxblur.value;
            bokehPass.uniforms.maxblur.value = manualBlur;
            bokehPass.uniforms.aperture.value = manualBlur > 0 ? 0.00001 : 0;
            if (typeof debugPanel.setBlurDisplay === 'function') {
                debugPanel.setBlurDisplay(manualBlur);
            }
        } else {
            const adaptiveBlur = debugPanel.blurDirection === 'close'
                ? calculateAdaptiveBlurClose(distanceToTarget, debugPanel.blurStrength)
                : calculateAdaptiveBlurFar(distanceToTarget, debugPanel.blurStrength);
            bokehPass.uniforms.maxblur.value = adaptiveBlur;
            // Scale aperture with blur strength (0 strength = 0 aperture)
            bokehPass.uniforms.aperture.value = debugPanel.blurStrength * 0.0001;
            if (typeof debugPanel.setBlurDisplay === 'function') {
                debugPanel.setBlurDisplay(adaptiveBlur);
            }
        }
    }

    updateStarInfoPosition(camera, controls);

    composer.render();
}

// Initialize
loadStars(scene);
animate();

