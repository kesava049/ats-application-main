/**
 * Centralized Authentication Error Handler
 * Handles 401 (Unauthorized) and 403 (Forbidden) errors consistently across the application
 */

/**
 * Handles authentication errors by clearing localStorage and redirecting to login
 * @param response - The fetch Response object
 * @throws Error with appropriate message
 */
export const handleAuthError = (response: Response): void => {
  if (response.status === 401) {
    console.warn('🔒 Authentication error: Token expired or invalid');
    
    // Clear all auth-related data from localStorage
    localStorage.removeItem("authenticated");
    localStorage.removeItem("auth_email");
    localStorage.removeItem("ats_user");
    
    // Redirect to login page
    window.location.href = '/login';
    
    // Throw error for logging purposes
    throw new Error('Session expired. Please login again.');
  }
  
  if (response.status === 403) {
    console.warn('🚫 Authorization error: Access denied');
    throw new Error('Access denied. You do not have permission to perform this action.');
  }
};

/**
 * Checks if a response indicates an authentication error
 * @param response - The fetch Response object
 * @returns true if response is 401 or 403
 */
export const isAuthError = (response: Response): boolean => {
  return response.status === 401 || response.status === 403;
};

/**
 * Clears authentication data from localStorage
 */
export const clearAuthData = (): void => {
  localStorage.removeItem("authenticated");
  localStorage.removeItem("auth_email");
  localStorage.removeItem("ats_user");
};

/**
 * Gets authentication token from localStorage
 * @returns JWT token or null if not found
 */
export const getAuthToken = (): string | null => {
  try {
    const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
    return user?.token || null;
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    return null;
  }
};

/**
 * Gets company ID from localStorage
 * @returns Company ID or null if not found
 */
export const getCompanyId = (): number | null => {
  try {
    const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
    return user?.companyId || null;
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    return null;
  }
};

/**
 * Validates if a JWT token is expired
 * @param token - JWT token string
 * @returns true if token is valid (not expired)
 */
export const isTokenValid = (token: string): boolean => {
  try {
    // Decode JWT payload (without verification, just to check expiration)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    
    // Check if token is expired (with 5 minute buffer)
    return exp > now + (5 * 60 * 1000);
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

/**
 * Checks if user is authenticated with a valid token
 * @returns true if user is authenticated with valid token
 */
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;
  return isTokenValid(token);
};

