const MIN_DISTANCE = 100;
const MAX_DISTANCE = 2500;
const DISTANCE_RANGE = 2400;
const BASE_STRENGTH = 0.3;
const BASE_RADIUS = 0.5;
const STRENGTH_DELTA = 0.552;
const RADIUS_DELTA = 0.35;
const EASING_POWER = 2.3;

/**
 * Calculates bloom strength using a new polynomial:
 * At d=100 (close): S = 0.3
 * At d=1000: S ≈ 0.7
 * At d=2500 (far): S ≈ 0.85
 *
 * @param {number} cameraDistance - The distance from camera to target
 * @returns {number} Bloom strength value
 */
export function calculateAdaptiveBloomStrength(cameraDistance) {
    // Normalize and clamp: t = clamp((d-100)/2400, 0, 1)
    const t = Math.min(Math.max((cameraDistance - MIN_DISTANCE) / DISTANCE_RANGE, 0), 1);

    // Apply easing curve: 1 - (1 - t)^2.3
    const eased = 1 - Math.pow(1 - t, EASING_POWER);

    // Calculate strength: S = 0.3 + 0.552 * eased
    const strength = BASE_STRENGTH + eased * STRENGTH_DELTA;
    return strength;
}

/**
 * Calculates bloom radius using the equation:
 * R(d) = 0.5 + [1 - (1 - clamp((d-100)/2400, 0, 1))^2.3] · 0.35
 *
 * @param {number} cameraDistance - The distance from camera to target
 * @returns {number} Bloom radius value
 */
export function calculateAdaptiveBloomRadius(cameraDistance) {
    // Normalize and clamp: t = clamp((d-100)/2400, 0, 1)
    const t = Math.min(Math.max((cameraDistance - MIN_DISTANCE) / DISTANCE_RANGE, 0), 1);

    // Apply easing curve: 1 - (1 - t)^2.3
    const eased = 1 - Math.pow(1 - t, EASING_POWER);

    // Calculate radius
    const radius = BASE_RADIUS + eased * RADIUS_DELTA;
    return radius;
}

/**
 * Calculates bloom threshold using the inverse equation:
 * T(d) = (1 - clamp((d-100)/2400, 0, 1))^2.3
 *
 * Goes from 1 (close/zoomed in) to 0 (far/zoomed out)
 *
 * @param {number} cameraDistance - The distance from camera to target
 * @returns {number} Bloom threshold value
 */
export function calculateAdaptiveBloomThreshold(cameraDistance) {
    // Normalize and clamp: t = clamp((d-100)/2400, 0, 1)
    const t = Math.min(Math.max((cameraDistance - MIN_DISTANCE) / DISTANCE_RANGE, 0), 1);

    // Apply inverse easing curve: (1 - t)^2.3
    const threshold = Math.pow(1 - t, EASING_POWER);
    return threshold;
}

/**
 * Calculates blur intensity - more blur when zoomed IN
 * Blur(d) = strength * (1 - clamp((d-100)/2400, 0, 1))^2.3
 *
 * @param {number} cameraDistance - The distance from camera to target
 * @param {number} strength - Blur strength multiplier (0-1)
 * @returns {number} Blur maxblur value
 */
export function calculateAdaptiveBlurClose(cameraDistance, strength = 0.1) {
    // Normalize and clamp: t = clamp((d-100)/2400, 0, 1)
    const t = Math.min(Math.max((cameraDistance - MIN_DISTANCE) / DISTANCE_RANGE, 0), 1);

    // Apply inverse easing curve: (1 - t)^2.3
    // More blur when close (t=0), less when far (t=1)
    const blur = strength * Math.pow(1 - t, EASING_POWER);
    return blur;
}

/**
 * Calculates blur intensity - more blur when zoomed OUT
 * Blur(d) = strength * [1 - (1 - clamp((d-100)/2400, 0, 1))^2.3]
 *
 * @param {number} cameraDistance - The distance from camera to target
 * @param {number} strength - Blur strength multiplier (0-1)
 * @returns {number} Blur maxblur value
 */
export function calculateAdaptiveBlurFar(cameraDistance, strength = 0.1) {
    // Normalize and clamp: t = clamp((d-100)/2400, 0, 1)
    const t = Math.min(Math.max((cameraDistance - MIN_DISTANCE) / DISTANCE_RANGE, 0), 1);

    // Apply easing curve: 1 - (1 - t)^2.3
    // Less blur when close (t=0), more when far (t=1)
    const eased = 1 - Math.pow(1 - t, EASING_POWER);
    const blur = strength * eased;
    return blur;
}
