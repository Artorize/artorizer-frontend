import * as THREE from 'three';

// Convert B-V color index to RGB color
export function bvToColor(bv) {
    // B-V index typically ranges from -0.5 (blue) to 2.0 (red)
    // Normalize to 0-1 range
    const t = Math.max(-0.5, Math.min(2.0, bv));
    const normalized = (t + 0.5) / 2.5;

    let r, g, b;

    if (normalized < 0.25) {
        // Blue to blue-white
        const factor = normalized / 0.25;
        r = 0.6 + factor * 0.4;
        g = 0.7 + factor * 0.3;
        b = 1.0;
    } else if (normalized < 0.5) {
        // Blue-white to white
        const factor = (normalized - 0.25) / 0.25;
        r = 1.0;
        g = 1.0;
        b = 1.0 - factor * 0.1;
    } else if (normalized < 0.75) {
        // White to yellow
        const factor = (normalized - 0.5) / 0.25;
        r = 1.0;
        g = 1.0 - factor * 0.2;
        b = 0.9 - factor * 0.5;
    } else {
        // Yellow to red
        const factor = (normalized - 0.75) / 0.25;
        r = 1.0;
        g = 0.8 - factor * 0.5;
        b = 0.4 - factor * 0.4;
    }

    return new THREE.Color(r, g, b);
}

// Get color name from B-V index
export function getColorName(bv) {
    if (bv < -0.1) return 'Blue';
    if (bv < 0.3) return 'Blue-White';
    if (bv < 0.6) return 'White';
    if (bv < 0.9) return 'Yellow-White';
    if (bv < 1.2) return 'Yellow';
    if (bv < 1.5) return 'Orange';
    return 'Red';
}

// Get color name from RGB values
export function getColorNameFromRGB(r, g, b) {
    if (b > 0.9 && r < 0.6) return 'Blue';
    if (b > 0.85 && r < 0.8) return 'Blue-White';
    if (r > 0.9 && g > 0.9 && b > 0.85) return 'White';
    if (r > 0.95 && g > 0.8 && b < 0.8) return 'Yellow-White';
    if (r > 0.95 && g > 0.75 && b < 0.7) return 'Yellow';
    if (r > 0.95 && g > 0.6 && g < 0.75) return 'Orange';
    return 'Red';
}
