/**
 * Authentication State Management
 *
 * Global state manager for authentication state.
 * Supports multi-tab synchronization via localStorage events.
 */

/**
 * Authentication State Manager
 */
class AuthState {
  constructor() {
    this.state = {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null
    };

    this.listeners = [];
    this.setupStorageListener();
  }

  /**
   * Update state and notify all listeners
   * @param {Object} updates - Partial state updates
   */
  setState(updates) {
    const previousState = { ...this.state };

    this.state = {
      ...this.state,
      ...updates
    };

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.state, previousState);
      } catch (error) {
        console.error('State listener error:', error);
      }
    });

    // Broadcast to other tabs
    this.broadcastState();
  }

  /**
   * Subscribe to state changes
   * @param {Function} listener - Callback function(newState, previousState)
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }

    this.listeners.push(listener);

    // Immediately call with current state
    listener(this.state, {});

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Get current state
   * @returns {Object} Current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Reset state to initial values
   */
  reset() {
    this.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  }

  /**
   * Setup listener for state changes in other tabs
   */
  setupStorageListener() {
    window.addEventListener('storage', (event) => {
      if (event.key === 'auth-state-sync') {
        try {
          const newState = JSON.parse(event.newValue || '{}');

          // Update local state without broadcasting
          // (to avoid infinite loop)
          this.state = newState;

          // Notify listeners
          this.listeners.forEach(listener => {
            try {
              listener(this.state, {});
            } catch (error) {
              console.error('State listener error:', error);
            }
          });
        } catch (error) {
          console.error('Failed to parse synced auth state:', error);
        }
      }
    });
  }

  /**
   * Broadcast state to other tabs
   */
  broadcastState() {
    try {
      // Use localStorage event to sync across tabs
      localStorage.setItem('auth-state-sync', JSON.stringify(this.state));

      // Remove immediately to trigger event
      // (storage event only fires when value changes)
      setTimeout(() => {
        localStorage.removeItem('auth-state-sync');
      }, 10);
    } catch (error) {
      // Ignore localStorage errors (e.g., in incognito mode)
      console.warn('Failed to broadcast auth state:', error);
    }
  }
}

// Export singleton instance
export const authState = new AuthState();

/**
 * React-style hook for auth state
 * Usage in your code:
 *
 * ```javascript
 * import { useAuthState } from '/src/auth/authState.js';
 *
 * const unsubscribe = useAuthState((state) => {
 *   if (state.isAuthenticated) {
 *     console.log('User:', state.user.name);
 *   }
 * });
 *
 * // Later, cleanup:
 * unsubscribe();
 * ```
 */
export function useAuthState(callback) {
  return authState.subscribe(callback);
}
