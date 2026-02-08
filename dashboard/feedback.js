/**
 * Feedback Modal - Sends user feedback to the Artorize team
 */

function openFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Pre-fill email from authenticated user if available
    const emailInput = document.getElementById('feedback-email');
    if (emailInput && window.__artorize_user?.email) {
        emailInput.value = window.__artorize_user.email;
    }

    // Reset form
    document.getElementById('feedback-type').value = 'general';
    document.getElementById('feedback-subject').value = '';
    document.getElementById('feedback-message').value = '';
    document.getElementById('feedback-status').textContent = '';
    document.getElementById('feedback-submit-btn').disabled = false;
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

async function submitFeedback() {
    const type = document.getElementById('feedback-type').value;
    const subject = document.getElementById('feedback-subject').value.trim();
    const message = document.getElementById('feedback-message').value.trim();
    const email = document.getElementById('feedback-email').value.trim();
    const statusEl = document.getElementById('feedback-status');
    const submitBtn = document.getElementById('feedback-submit-btn');

    // Validate
    if (!subject) {
        statusEl.textContent = 'Please enter a subject.';
        statusEl.style.color = 'var(--art-danger)';
        return;
    }
    if (!message) {
        statusEl.textContent = 'Please enter a message.';
        statusEl.style.color = 'var(--art-danger)';
        return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        statusEl.textContent = 'Please enter a valid email address.';
        statusEl.style.color = 'var(--art-danger)';
        return;
    }

    // Disable button and show sending state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    statusEl.textContent = '';

    try {
        const routerUrl = window.__artorize_config?.routerUrl || 'https://router.artorizer.com';
        const resp = await fetch(`${routerUrl}/api/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, subject, message, email }),
        });

        const data = await resp.json();

        if (resp.ok && data.success) {
            statusEl.textContent = 'Feedback sent successfully! Thank you.';
            statusEl.style.color = 'var(--art-info)';
            setTimeout(() => closeFeedbackModal(), 2000);
        } else {
            statusEl.textContent = data.error || 'Failed to send feedback. Please try again.';
            statusEl.style.color = 'var(--art-danger)';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Feedback';
        }
    } catch (err) {
        statusEl.textContent = 'Network error. Please try again.';
        statusEl.style.color = 'var(--art-danger)';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Feedback';
    }
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('feedback-modal');
        if (modal && !modal.classList.contains('hidden')) {
            closeFeedbackModal();
        }
    }
});
