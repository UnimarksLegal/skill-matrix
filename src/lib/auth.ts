/**
 * Authentication utility functions
 * Manages JWT token storage and validation
 */

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const auth = {
  /**
   * Store authentication token
   */
  setToken(token: string, username: string) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, username);
  },

  /**
   * Get stored authentication token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Get stored username
   */
  getUser(): string | null {
    return localStorage.getItem(USER_KEY);
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  /**
   * Clear authentication data (logout)
   */
  clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Get authorization header for API requests
   */
  getAuthHeader(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};
