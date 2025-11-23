/**
 * Authenticated Fetch Utility
 *
 * Wrapper around fetch() that automatically includes credentials
 * and handles authentication errors.
 */

/**
 * Fetch with automatic credential inclusion and error handling
 *
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function authenticatedFetch(url, options = {}) {
  const defaultOptions = {
    credentials: 'include', // Always include cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  // Merge options
  const mergedOptions = {
    ...options,
    ...defaultOptions,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  // Remove Content-Type for FormData (browser will set it with boundary)
  if (options.body instanceof FormData) {
    delete mergedOptions.headers['Content-Type'];
  }

  try {
    const response = await fetch(url, mergedOptions);

    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login.html?returnUrl=${returnUrl}`;
      throw new AuthFetchError('Unauthorized', 401, 'AUTH_REQUIRED');
    }

    // Handle 403 Forbidden
    if (response.status === 403) {
      throw new AuthFetchError('Forbidden', 403, 'FORBIDDEN');
    }

    return response;

  } catch (error) {
    // Rethrow custom errors
    if (error instanceof AuthFetchError) {
      throw error;
    }

    // Network errors
    console.error('Fetch error:', error);
    throw new AuthFetchError('Network error', 0, 'NETWORK_ERROR', error);
  }
}

/**
 * Custom error class for authenticated fetch errors
 */
export class AuthFetchError extends Error {
  constructor(message, status, code, originalError = null) {
    super(message);
    this.name = 'AuthFetchError';
    this.status = status;
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Convenient API methods
 */
export const api = {
  /**
   * GET request
   * @param {string} url - URL to fetch
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} JSON response
   */
  async get(url, options = {}) {
    const response = await authenticatedFetch(url, {
      method: 'GET',
      ...options
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Unknown error',
        message: response.statusText
      }));
      throw new AuthFetchError(
        error.message || 'Request failed',
        response.status,
        error.code || 'REQUEST_FAILED'
      );
    }

    return response.json();
  },

  /**
   * POST request
   * @param {string} url - URL to fetch
   * @param {any} data - Data to send (will be JSON stringified)
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} JSON response
   */
  async post(url, data, options = {}) {
    const response = await authenticatedFetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Unknown error',
        message: response.statusText
      }));
      throw new AuthFetchError(
        error.message || 'Request failed',
        response.status,
        error.code || 'REQUEST_FAILED'
      );
    }

    return response.json();
  },

  /**
   * PUT request
   * @param {string} url - URL to fetch
   * @param {any} data - Data to send (will be JSON stringified)
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} JSON response
   */
  async put(url, data, options = {}) {
    const response = await authenticatedFetch(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Unknown error',
        message: response.statusText
      }));
      throw new AuthFetchError(
        error.message || 'Request failed',
        response.status,
        error.code || 'REQUEST_FAILED'
      );
    }

    return response.json();
  },

  /**
   * DELETE request
   * @param {string} url - URL to fetch
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} JSON response
   */
  async delete(url, options = {}) {
    const response = await authenticatedFetch(url, {
      method: 'DELETE',
      ...options
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Unknown error',
        message: response.statusText
      }));
      throw new AuthFetchError(
        error.message || 'Request failed',
        response.status,
        error.code || 'REQUEST_FAILED'
      );
    }

    return response.json();
  },

  /**
   * Upload file(s) via FormData
   * @param {string} url - URL to upload to
   * @param {FormData} formData - FormData with files and fields
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} JSON response
   */
  async upload(url, formData, options = {}) {
    const response = await authenticatedFetch(url, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for multipart/form-data
      ...options
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Unknown error',
        message: response.statusText
      }));
      throw new AuthFetchError(
        error.message || 'Upload failed',
        response.status,
        error.code || 'UPLOAD_FAILED'
      );
    }

    return response.json();
  }
};
