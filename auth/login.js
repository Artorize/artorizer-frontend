/**
 * Login Page JavaScript
 * Implements email/password and OAuth authentication flows
 */

import { authManager } from '../src/auth/authManager.js';

// State management
let loginStep = 'email'; // 'email' or 'password'
let currentEmail = '';

// DOM Elements
const elements = {
    // Toggle buttons
    loginToggle: null,
    signupToggle: null,

    // Containers
    emailFormContainer: null,
    signupFormContainer: null,

    // Login form elements
    emailForm: null,
    emailInput: null,
    passwordStep: null,
    loginPasswordInput: null,
    loginSubmitBtn: null,
    loginError: null,

    // Signup form elements
    signupForm: null,
    usernameInput: null,
    signupEmailInput: null,
    passwordInput: null,
    confirmPasswordInput: null,
    signupSubmitBtn: null,
    signupError: null,
    strengthBar: null,
    strengthText: null,

    // OAuth buttons
    googleSignin: null,
    githubSignin: null,
    googleSignup: null,
    githubSignup: null
};

/**
 * Initialize DOM elements
 */
function initElements() {
    elements.loginToggle = document.getElementById('login-toggle');
    elements.signupToggle = document.getElementById('signup-toggle');
    elements.emailFormContainer = document.getElementById('email-form-container');
    elements.signupFormContainer = document.getElementById('signup-form-container');
    elements.emailForm = document.getElementById('email-form');
    elements.emailInput = document.getElementById('email');
    elements.passwordStep = document.getElementById('password-step');
    elements.loginPasswordInput = document.getElementById('login-password');
    elements.loginSubmitBtn = document.getElementById('login-submit-btn');
    elements.loginError = document.getElementById('login-error');
    elements.signupForm = document.getElementById('signup-form');
    elements.usernameInput = document.getElementById('username');
    elements.signupEmailInput = document.getElementById('signup-email');
    elements.passwordInput = document.getElementById('password');
    elements.confirmPasswordInput = document.getElementById('confirm-password');
    elements.signupSubmitBtn = document.getElementById('signup-submit-btn');
    elements.signupError = document.getElementById('signup-error');
    elements.strengthBar = document.querySelector('.strength-bar');
    elements.strengthText = document.querySelector('.strength-text');
    elements.googleSignin = document.getElementById('google-signin');
    elements.githubSignin = document.getElementById('github-signin');
    elements.googleSignup = document.getElementById('google-signup');
    elements.githubSignup = document.getElementById('github-signup');
}

/**
 * Show error message
 */
function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

/**
 * Hide error message
 */
function hideError(element) {
    if (element) {
        element.style.display = 'none';
        element.textContent = '';
    }
}

/**
 * Set button loading state
 */
function setButtonLoading(button, loading, loadingText = 'Loading...') {
    if (!button) return;

    if (loading) {
        button.dataset.originalText = button.textContent;
        button.textContent = loadingText;
        button.disabled = true;
    } else {
        button.textContent = button.dataset.originalText || button.textContent;
        button.disabled = false;
    }
}

/**
 * Switch to signup form with optional pre-filled email
 */
function switchToSignup(email = '') {
    elements.signupToggle.classList.add('active');
    elements.loginToggle.classList.remove('active');
    elements.signupFormContainer.classList.add('active');
    elements.emailFormContainer.classList.remove('active');

    if (email && elements.signupEmailInput) {
        elements.signupEmailInput.value = email;
    }

    // Reset login form state
    resetLoginForm();
}

/**
 * Switch to login form
 */
function switchToLogin() {
    elements.loginToggle.classList.add('active');
    elements.signupToggle.classList.remove('active');
    elements.emailFormContainer.classList.add('active');
    elements.signupFormContainer.classList.remove('active');

    resetLoginForm();
}

/**
 * Reset login form to email step
 */
function resetLoginForm() {
    loginStep = 'email';
    currentEmail = '';

    if (elements.passwordStep) {
        elements.passwordStep.style.display = 'none';
    }
    if (elements.loginPasswordInput) {
        elements.loginPasswordInput.value = '';
        elements.loginPasswordInput.removeAttribute('required');
    }
    if (elements.loginSubmitBtn) {
        elements.loginSubmitBtn.textContent = 'Continue';
    }
    if (elements.emailInput) {
        elements.emailInput.disabled = false;
    }
    hideError(elements.loginError);
}

/**
 * Show password step in login form
 */
function showPasswordStep() {
    loginStep = 'password';

    if (elements.passwordStep) {
        elements.passwordStep.style.display = 'block';
    }
    if (elements.loginPasswordInput) {
        elements.loginPasswordInput.setAttribute('required', 'required');
        elements.loginPasswordInput.focus();
    }
    if (elements.loginSubmitBtn) {
        elements.loginSubmitBtn.textContent = 'Sign in';
    }
    if (elements.emailInput) {
        elements.emailInput.disabled = true;
    }
}

/**
 * Calculate password strength
 */
function calculatePasswordStrength(password) {
    if (!password) return { score: 0, label: '', className: '' };

    let score = 0;

    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^a-zA-Z0-9]/.test(password)) score += 15;

    let label = '';
    let className = '';

    if (score <= 25) {
        label = 'Weak';
        className = 'weak';
    } else if (score <= 50) {
        label = 'Average';
        className = 'average';
    } else if (score <= 75) {
        label = 'Good';
        className = 'good';
    } else {
        label = 'Perfect';
        className = 'perfect';
    }

    return { score, label, className };
}

/**
 * Update password strength indicator
 */
function updatePasswordStrength() {
    if (!elements.passwordInput || !elements.strengthBar || !elements.strengthText) return;

    const password = elements.passwordInput.value;
    const strength = calculatePasswordStrength(password);

    elements.strengthBar.className = `strength-bar ${strength.className}`;
    elements.strengthText.textContent = strength.label;
    elements.strengthText.className = `strength-text ${strength.className}`;
}

/**
 * Handle email form submission
 */
async function handleEmailFormSubmit(e) {
    e.preventDefault();
    hideError(elements.loginError);

    const email = elements.emailInput.value.trim();

    if (!email) {
        showError(elements.loginError, 'Please enter your email address');
        return;
    }

    // Step 1: Check if email exists
    if (loginStep === 'email') {
        setButtonLoading(elements.loginSubmitBtn, true, 'Checking...');

        try {
            const result = await authManager.checkAvailability(email);

            if (result.emailAvailable) {
                // Email doesn't exist - switch to signup
                switchToSignup(email);
            } else {
                // Email exists - show password field
                currentEmail = email;
                showPasswordStep();
            }
        } catch (error) {
            console.error('Email check error:', error);
            showError(elements.loginError, 'Unable to check email. Please try again.');
        } finally {
            setButtonLoading(elements.loginSubmitBtn, false);
        }
        return;
    }

    // Step 2: Login with email and password
    if (loginStep === 'password') {
        const password = elements.loginPasswordInput.value;

        if (!password) {
            showError(elements.loginError, 'Please enter your password');
            return;
        }

        setButtonLoading(elements.loginSubmitBtn, true, 'Signing in...');

        try {
            await authManager.login(currentEmail, password);
            // Redirect to dashboard on success
            window.location.href = '/dashboard/dashboard-v2.html';
        } catch (error) {
            console.error('Login error:', error);
            showError(elements.loginError, error.message || 'Invalid credentials. Please try again.');
        } finally {
            setButtonLoading(elements.loginSubmitBtn, false);
        }
    }
}

/**
 * Handle signup form submission
 */
async function handleSignupFormSubmit(e) {
    e.preventDefault();
    hideError(elements.signupError);

    const username = elements.usernameInput.value.trim();
    const email = elements.signupEmailInput.value.trim();
    const password = elements.passwordInput.value;
    const confirmPassword = elements.confirmPasswordInput.value;

    // Validate all fields
    if (!username || !email || !password || !confirmPassword) {
        showError(elements.signupError, 'Please fill in all fields');
        return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
        showError(elements.signupError, 'Passwords do not match');
        return;
    }

    // Check password strength
    const strength = calculatePasswordStrength(password);
    if (strength.score < 40) {
        showError(elements.signupError, 'Please choose a stronger password');
        return;
    }

    setButtonLoading(elements.signupSubmitBtn, true, 'Creating account...');

    try {
        // Check username availability first
        const availability = await authManager.checkAvailability(email, username);

        if (!availability.emailAvailable) {
            showError(elements.signupError, 'An account with this email already exists');
            setButtonLoading(elements.signupSubmitBtn, false);
            return;
        }

        if (!availability.usernameAvailable) {
            showError(elements.signupError, 'This username is already taken');
            setButtonLoading(elements.signupSubmitBtn, false);
            return;
        }

        // Register the user
        await authManager.register(email, username, password);

        // Redirect to dashboard on success
        window.location.href = '/dashboard/dashboard-v2.html';
    } catch (error) {
        console.error('Signup error:', error);
        showError(elements.signupError, error.message || 'Registration failed. Please try again.');
    } finally {
        setButtonLoading(elements.signupSubmitBtn, false);
    }
}

/**
 * Handle OAuth sign in
 */
function handleOAuthSignIn(provider) {
    try {
        if (provider === 'google') {
            authManager.signInWithGoogle();
        } else if (provider === 'github') {
            authManager.signInWithGitHub();
        }
    } catch (error) {
        console.error(`${provider} sign-in error:`, error);
        alert(`Failed to sign in with ${provider}. Please try again.`);
    }
}

/**
 * Initialize form toggle
 */
function initFormToggle() {
    if (elements.loginToggle) {
        elements.loginToggle.addEventListener('click', switchToLogin);
    }

    if (elements.signupToggle) {
        elements.signupToggle.addEventListener('click', () => switchToSignup());
    }
}

/**
 * Initialize form handlers
 */
function initFormHandlers() {
    if (elements.emailForm) {
        elements.emailForm.addEventListener('submit', handleEmailFormSubmit);
    }

    if (elements.signupForm) {
        elements.signupForm.addEventListener('submit', handleSignupFormSubmit);
    }

    // Allow changing email when in password step
    if (elements.emailInput) {
        elements.emailInput.addEventListener('input', () => {
            if (loginStep === 'password') {
                resetLoginForm();
            }
        });
    }
}

/**
 * Initialize password strength indicator
 */
function initPasswordStrength() {
    if (elements.passwordInput) {
        elements.passwordInput.addEventListener('input', updatePasswordStrength);
    }
}

/**
 * Initialize OAuth buttons
 */
function initOAuthButtons() {
    // Login form OAuth
    if (elements.googleSignin) {
        elements.googleSignin.addEventListener('click', () => handleOAuthSignIn('google'));
    }

    if (elements.githubSignin) {
        elements.githubSignin.addEventListener('click', () => handleOAuthSignIn('github'));
    }

    // Signup form OAuth
    if (elements.googleSignup) {
        elements.googleSignup.addEventListener('click', () => handleOAuthSignIn('google'));
    }

    if (elements.githubSignup) {
        elements.githubSignup.addEventListener('click', () => handleOAuthSignIn('github'));
    }
}

/**
 * Check if user is already authenticated
 */
async function checkExistingSession() {
    try {
        const isAuthenticated = await authManager.isAuthenticated();
        if (isAuthenticated) {
            // User already logged in, redirect to dashboard
            window.location.href = '/dashboard/dashboard-v2.html';
        }
    } catch (error) {
        // Not authenticated, stay on login page
        console.log('No existing session');
    }
}

/**
 * Initialize everything
 */
function init() {
    initElements();
    initFormToggle();
    initFormHandlers();
    initPasswordStrength();
    initOAuthButtons();
    checkExistingSession();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
