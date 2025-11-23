// Import authentication manager
import { authManager } from '../src/auth/authManager.js';

// Enable mock auth for development
import { enableMockAuth } from '../src/auth/__mocks__/mockAuthBackend.js';

// Auto-enable mock auth in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    enableMockAuth();
    console.log('🔧 Mock authentication enabled for development');
}

// Initialize login UI
import '../src/auth/loginUI.js';

// Base URL for API calls
const API_BASE_URL = 'https://router.artorizer.com';

// Password strength calculator
function calculatePasswordStrength(password) {
    if (!password) return { score: 0, label: '', className: '' };

    let score = 0;

    // Length check
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^a-zA-Z0-9]/.test(password)) score += 15;

    // Determine label and class
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

// Update password strength indicator
function updatePasswordStrength(passwordInput, strengthBar, strengthText) {
    const password = passwordInput.value;
    const strength = calculatePasswordStrength(password);

    // Update bar
    strengthBar.className = `strength-bar ${strength.className}`;

    // Update text
    strengthText.textContent = strength.label;
    strengthText.className = `strength-text ${strength.className}`;
}

// Form toggle functionality
function initFormToggle() {
    const loginBtn = document.getElementById('login-toggle');
    const signupBtn = document.getElementById('signup-toggle');
    const emailForm = document.getElementById('email-form-container');
    const signupForm = document.getElementById('signup-form-container');

    if (!loginBtn || !signupBtn || !emailForm || !signupForm) return;

    loginBtn.addEventListener('click', () => {
        loginBtn.classList.add('active');
        signupBtn.classList.remove('active');
        emailForm.classList.add('active');
        signupForm.classList.remove('active');
    });

    signupBtn.addEventListener('click', () => {
        signupBtn.classList.add('active');
        loginBtn.classList.remove('active');
        signupForm.classList.add('active');
        emailForm.classList.remove('active');
    });
}

// Initialize password strength indicators
function initPasswordStrength() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    if (passwordInput) {
        const strengthBar = document.querySelector('.strength-bar');
        const strengthText = document.querySelector('.strength-text');

        if (strengthBar && strengthText) {
            passwordInput.addEventListener('input', () => {
                updatePasswordStrength(passwordInput, strengthBar, strengthText);
            });
        }
    }
}

/**
 * Check if email exists in the system
 * NOTE: This endpoint doesn't exist yet in Better Auth
 * This is a placeholder for future backend implementation
 */
async function checkEmailExists(email) {
    try {
        // TODO: This endpoint needs to be added to the backend
        // For now, we'll return false to allow signup flow
        const response = await fetch(`${API_BASE_URL}/api/auth/check-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
            credentials: 'include'
        });

        if (!response.ok) {
            // If endpoint doesn't exist (404) or any error, assume email doesn't exist
            return false;
        }

        const data = await response.json();
        return data.exists || false;
    } catch (error) {
        console.warn('Email check failed, assuming email does not exist:', error);
        // If the endpoint doesn't exist yet, assume email doesn't exist
        // This allows the signup flow to work
        return false;
    }
}

// Form submission handlers
function initFormHandlers() {
    // Email login form
    const emailForm = document.getElementById('email-form');
    if (emailForm) {
        emailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;

            // Show loading state
            const submitBtn = emailForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Checking...';
            submitBtn.disabled = true;

            try {
                // TODO: Implement email/password login when backend supports it
                console.log('Email login:', email);
                alert('Email login not yet implemented. Please use Google or GitHub.');
            } catch (error) {
                console.error('Email login error:', error);
                alert('An error occurred. Please try again.');
            } finally {
                // Restore button state
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Signup form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const signupEmail = document.getElementById('signup-email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            // Validate passwords match
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            // Check password strength
            const strength = calculatePasswordStrength(password);
            if (strength.score < 40) {
                alert('Please choose a stronger password');
                return;
            }

            // Show loading state
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creating account...';
            submitBtn.disabled = true;

            try {
                // TODO: Implement email/password signup when backend supports it
                console.log('Signup:', { username, email: signupEmail, password });
                alert('Email signup not yet implemented. Please use Google or GitHub.');
            } catch (error) {
                console.error('Signup error:', error);
                alert('An error occurred. Please try again.');
            } finally {
                // Restore button state
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// OAuth button handlers
function initOAuthButtons() {
    // Login form OAuth buttons
    const googleSigninBtn = document.getElementById('google-signin');
    const githubSigninBtn = document.getElementById('github-signin');

    // Signup form OAuth buttons
    const googleSignupBtn = document.getElementById('google-signup');
    const githubSignupBtn = document.getElementById('github-signup');

    // Google Sign In
    if (googleSigninBtn) {
        googleSigninBtn.addEventListener('click', async () => {
            console.log('Google OAuth signin clicked');
            try {
                await authManager.signInWithGoogle();
            } catch (error) {
                console.error('Google sign-in error:', error);
                alert('Failed to sign in with Google. Please try again.');
            }
        });
    }

    // GitHub Sign In
    if (githubSigninBtn) {
        githubSigninBtn.addEventListener('click', async () => {
            console.log('GitHub OAuth signin clicked');
            try {
                await authManager.signInWithGitHub();
            } catch (error) {
                console.error('GitHub sign-in error:', error);
                alert('Failed to sign in with GitHub. Please try again.');
            }
        });
    }

    // Google Sign Up
    if (googleSignupBtn) {
        googleSignupBtn.addEventListener('click', async () => {
            console.log('Google OAuth signup clicked');
            try {
                await authManager.signInWithGoogle();
            } catch (error) {
                console.error('Google sign-up error:', error);
                alert('Failed to sign up with Google. Please try again.');
            }
        });
    }

    // GitHub Sign Up
    if (githubSignupBtn) {
        githubSignupBtn.addEventListener('click', async () => {
            console.log('GitHub OAuth signup clicked');
            try {
                await authManager.signInWithGitHub();
            } catch (error) {
                console.error('GitHub sign-up error:', error);
                alert('Failed to sign up with GitHub. Please try again.');
            }
        });
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initFormToggle();
    initPasswordStrength();
    initFormHandlers();
    initOAuthButtons();
});
