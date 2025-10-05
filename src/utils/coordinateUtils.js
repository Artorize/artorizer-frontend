import * as THREE from 'three';

// Convert celestial coordinates (RA, Dec) to 3D Cartesian coordinates
export function celestialToCartesian(ra, dec, radius = 1000) {
    // Convert degrees to radians
    const raRad = (ra * Math.PI) / 180;
    const decRad = (dec * Math.PI) / 180;

    // Spherical to Cartesian conversion
    const x = radius * Math.cos(decRad) * Math.cos(raRad);
    const y = radius * Math.sin(decRad);
    const z = radius * Math.cos(decRad) * Math.sin(raRad);

    return new THREE.Vector3(x, y, z);
}
