import * as THREE from 'three';

// Raycasting for star selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedStar = null;
const starInfoElement = document.getElementById('star-info');

// Increase raycaster threshold for easier clicking on points
raycaster.params.Points.threshold = 10;

export function setupStarInteraction(renderer, camera, controls, getStarPoints, getStarData) {
    // Store camera and controls reference for positioning
    positionInfoPanel.camera = camera;
    positionInfoPanel.controls = controls;

    // Handle click events
    renderer.domElement.addEventListener('click', (event) => {
        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update raycaster
        raycaster.setFromCamera(mouse, camera);

        // Check for intersections with star points
        const starPoints = getStarPoints();
        if (starPoints) {
            const intersects = raycaster.intersectObject(starPoints);

            if (intersects.length > 0) {
                const index = intersects[0].index;
                const starData = getStarData();
                selectedStar = starData[index];

                // Show star info
                showStarInfo(selectedStar, event.clientX, event.clientY);
            } else {
                // Clicked on empty space - hide info
                hideStarInfo();
            }
        }
    });
}

function showStarInfo(star, screenX, screenY) {
    if (!star) return;

    // Build HTML content with proper structure
    const colorHex = '#' + star.color.getHexString();
    const content = `
        <h3>${star.name || `Star #${star.id}`}</h3>
        <div class="info-content">
            <div class="info-row">
                <span class="info-label">Distance</span>
                <span class="info-value">${star.distance.toFixed(2)} pc</span>
            </div>
            <div class="info-row">
                <span class="info-label">Luminosity</span>
                <span class="info-value">${star.luminosity.toFixed(2)} L☉</span>
            </div>
            <div class="info-row">
                <span class="info-label">Color</span>
                <span class="info-value">
                    ${star.colorName}
                    <span class="color-indicator" style="background-color: ${colorHex}; box-shadow: 0 0 8px ${colorHex};"></span>
                </span>
            </div>
        </div>
    `;

    starInfoElement.innerHTML = content;

    // Position immediately based on star's 3D position
    positionInfoPanel(star);

    // Show with animation
    setTimeout(() => {
        starInfoElement.classList.add('visible');
    }, 10);
}

function positionInfoPanel(star) {
    if (!star || !star.position) return;

    // Get the last camera reference (will be passed in updateStarInfoPosition)
    if (!positionInfoPanel.camera || !positionInfoPanel.controls) return;

    const camera = positionInfoPanel.camera;
    const controls = positionInfoPanel.controls;

    // Project 3D position to 2D screen coordinates
    const vector = star.position.clone();
    vector.project(camera);

    // Convert to screen space
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (vector.y * -0.5 + 0.5) * window.innerHeight;

    // Check if star is behind camera
    if (vector.z > 1) {
        return;
    }

    // Calculate zoom-based scale (closer = larger panel)
    const distanceToTarget = camera.position.distanceTo(controls.target);
    const minDistance = controls.minDistance || 100;
    const maxDistance = controls.maxDistance || 2500;
    const zoomRange = maxDistance - minDistance;
    const normalizedZoom = Math.min(Math.max((distanceToTarget - minDistance) / zoomRange, 0), 1);
    // Invert so closer = higher scale
    const scale = 0.7 + (1 - normalizedZoom) * 0.5; // Range from 0.7 to 1.2

    // Apply scale
    starInfoElement.style.transform = `scale(${scale})`;
    starInfoElement.style.transformOrigin = 'top left';

    // Base offset that ensures panel doesn't cover the star
    const baseOffsetX = 35;
    const baseOffsetY = -50;

    let offsetX = baseOffsetX;
    let offsetY = baseOffsetY;

    // Estimated panel dimensions (accounting for scale)
    const panelWidth = 240 * scale;
    const panelHeight = 140 * scale;

    // Check if panel would go off right edge
    if (x + offsetX + panelWidth > window.innerWidth - 20) {
        // Position to the left of the star
        offsetX = -(panelWidth + 35);
        starInfoElement.style.transformOrigin = 'top right';
    }

    // Check if panel would go off top edge
    if (y + offsetY < 20) {
        offsetY = 35; // Below the star
    }

    // Check if panel would go off bottom edge
    if (y + offsetY + panelHeight > window.innerHeight - 20) {
        offsetY = -(panelHeight + 35); // Above the star
    }

    starInfoElement.style.left = (x + offsetX) + 'px';
    starInfoElement.style.top = (y + offsetY) + 'px';
}

function hideStarInfo() {
    selectedStar = null;
    starInfoElement.classList.remove('visible');
}

// Update star info position during camera movement
export function updateStarInfoPosition(camera, controls) {
    // Store camera and controls reference for positionInfoPanel
    positionInfoPanel.camera = camera;
    positionInfoPanel.controls = controls;

    if (selectedStar && starInfoElement.classList.contains('visible')) {
        // Project 3D position to 2D screen coordinates
        const vector = selectedStar.position.clone();
        vector.project(camera);

        // Check if star is behind camera or outside view
        if (vector.z > 1) {
            hideStarInfo();
            return;
        }

        // Update position using the shared positioning logic
        positionInfoPanel(selectedStar);
    }
}
