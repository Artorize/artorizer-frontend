export function setupDebugPanel(camera, renderer, composer, controls) {
    const debugPanel = {
        rotationSpeedMultiplier: 1.0,
        isBloomStrengthManual: false,
        manualBloomStrength: null,
        setBloomStrengthDisplay: () => {},
        isBloomRadiusManual: false,
        manualBloomRadius: null,
        setBloomRadiusDisplay: () => {},
        isBloomThresholdManual: false,
        manualBloomThreshold: null,
        setBloomThresholdDisplay: () => {},
        isBlurManual: false,
        manualBlur: null,
        blurDirection: 'close', // 'close', 'far', or 'manual'
        blurStrength: 0,
        setBlurDisplay: () => {},
        setBlurStrengthDisplay: () => {}
    };

    // Get bloom pass from composer
    const bloomPass = composer.passes.find(pass => pass.constructor.name === 'UnrealBloomPass');
    const bokehPass = composer.passes.find(pass => pass.constructor.name === 'BokehPass');

    // Camera Z position
    const cameraZSlider = document.getElementById('camera-z');
    const cameraZValue = document.getElementById('camera-z-value');
    cameraZSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        camera.position.z = value;
        cameraZValue.textContent = value;
    });

    // Min Distance
    const minDistanceSlider = document.getElementById('min-distance');
    const minDistanceValue = document.getElementById('min-distance-value');
    minDistanceSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        controls.minDistance = value;
        minDistanceValue.textContent = value;
    });

    // Max Distance
    const maxDistanceSlider = document.getElementById('max-distance');
    const maxDistanceValue = document.getElementById('max-distance-value');
    maxDistanceSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        controls.maxDistance = value;
        maxDistanceValue.textContent = value;
    });

    // Bloom Strength
    const bloomStrengthSlider = document.getElementById('bloom-strength');
    const bloomStrengthValue = document.getElementById('bloom-strength-value');
    debugPanel.setBloomStrengthDisplay = (value) => {
        bloomStrengthValue.textContent = value.toFixed(1);
    };
    debugPanel.setBloomStrengthDisplay(bloomPass ? bloomPass.strength : 0);
    bloomStrengthSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        debugPanel.isBloomStrengthManual = true;
        debugPanel.manualBloomStrength = value;
        if (bloomPass) bloomPass.strength = value;
        debugPanel.setBloomStrengthDisplay(value);
    });

    // Bloom Radius
    const bloomRadiusSlider = document.getElementById('bloom-radius');
    const bloomRadiusValue = document.getElementById('bloom-radius-value');
    debugPanel.setBloomRadiusDisplay = (value) => {
        bloomRadiusValue.textContent = value.toFixed(2);
    };
    debugPanel.setBloomRadiusDisplay(bloomPass ? bloomPass.radius : 0);
    bloomRadiusSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        debugPanel.isBloomRadiusManual = true;
        debugPanel.manualBloomRadius = value;
        if (bloomPass) bloomPass.radius = value;
        debugPanel.setBloomRadiusDisplay(value);
    });

    // Bloom Threshold
    const bloomThresholdSlider = document.getElementById('bloom-threshold');
    const bloomThresholdValue = document.getElementById('bloom-threshold-value');
    debugPanel.setBloomThresholdDisplay = (value) => {
        bloomThresholdValue.textContent = value.toFixed(2);
    };
    debugPanel.setBloomThresholdDisplay(bloomPass ? bloomPass.threshold : 0);
    bloomThresholdSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        debugPanel.isBloomThresholdManual = true;
        debugPanel.manualBloomThreshold = value;
        if (bloomPass) bloomPass.threshold = value;
        debugPanel.setBloomThresholdDisplay(value);
    });

    // Exposure
    const exposureSlider = document.getElementById('exposure');
    const exposureValue = document.getElementById('exposure-value');
    exposureSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        renderer.toneMappingExposure = value;
        exposureValue.textContent = value.toFixed(1);
    });

    // Damping
    const dampingSlider = document.getElementById('damping');
    const dampingValue = document.getElementById('damping-value');
    dampingSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        controls.dampingFactor = value;
        dampingValue.textContent = value.toFixed(2);
    });

    // Rotation Speed
    const rotationSpeedSlider = document.getElementById('rotation-speed');
    const rotationSpeedValue = document.getElementById('rotation-speed-value');
    rotationSpeedSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        debugPanel.rotationSpeedMultiplier = value;
        rotationSpeedValue.textContent = value.toFixed(1);
    });

    // Blur controls
    const blurSlider = document.getElementById('blur-maxblur');
    const blurValue = document.getElementById('blur-maxblur-value');
    const blurDirectionSelect = document.getElementById('blur-direction');
    const blurStrengthSlider = document.getElementById('blur-strength');
    const blurStrengthValue = document.getElementById('blur-strength-value');

    if (blurSlider && blurValue && blurDirectionSelect && blurStrengthSlider && blurStrengthValue) {
        debugPanel.setBlurDisplay = (value) => {
            blurValue.textContent = value.toFixed(4);
        };
        debugPanel.setBlurStrengthDisplay = (value) => {
            blurStrengthValue.textContent = value.toFixed(2);
        };
        debugPanel.setBlurDisplay(bokehPass ? bokehPass.uniforms.maxblur.value : 0);
        debugPanel.setBlurStrengthDisplay(debugPanel.blurStrength);

        blurStrengthSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            debugPanel.blurStrength = value;
            debugPanel.setBlurStrengthDisplay(value);
        });

        blurSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            debugPanel.isBlurManual = true;
            debugPanel.manualBlur = value;
            if (bokehPass) bokehPass.uniforms.maxblur.value = value;
            debugPanel.setBlurDisplay(value);
        });

        blurDirectionSelect.addEventListener('change', (e) => {
            debugPanel.blurDirection = e.target.value;
            if (e.target.value === 'manual') {
                debugPanel.isBlurManual = true;
            } else {
                debugPanel.isBlurManual = false;
            }
        });
    }

    return debugPanel;
}

