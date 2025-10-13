/**
 * Authenticated API Client
 * Wrapper around fetch that automatically handles authentication and auth errors
 */

import { getAuthToken, getCompanyId, handleAuthError } from './auth-error-handler';

interface FetchOptions extends RequestInit {
  skipAuthCheck?: boolean;
}

/**
 * Authenticated fetch wrapper that automatically adds auth headers and handles auth errors
 * @param url - The URL to fetch
 * @param options - Fetch options (headers, method, body, etc.)
 * @returns Promise<Response>
 * @throws Error if authentication fails or network error occurs
 */
export async function authenticatedFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const { skipAuthCheck, ...fetchOptions } = options;
  
  // Get token from localStorage
  const token = getAuthToken();
  const companyId = getCompanyId();
  
  // Check if authentication is required
  if (!skipAuthCheck && !token) {
    console.error('❌ No JWT token found in localStorage');
    throw new Error('Authentication required. Please login again.');
  }
  
  // Prepare headers with authentication
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };
  
  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Add Company ID header if it exists
  if (companyId) {
    headers['X-Company-ID'] = companyId.toString();
  }
  
  // Make the request
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });
  
  // Handle authentication errors (401, 403)
  if (response.status === 401 || response.status === 403) {
    handleAuthError(response);
  }
  
  return response;
}

/**
 * Authenticated GET request
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Promise<Response>
 */
export async function get(url: string, options: FetchOptions = {}): Promise<Response> {
  return authenticatedFetch(url, { ...options, method: 'GET' });
}

/**
 * Authenticated POST request
 * @param url - The URL to fetch
 * @param data - Data to send in request body
 * @param options - Fetch options
 * @returns Promise<Response>
 */
export async function post(url: string, data?: any, options: FetchOptions = {}): Promise<Response> {
  return authenticatedFetch(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Authenticated PUT request
 * @param url - The URL to fetch
 * @param data - Data to send in request body
 * @param options - Fetch options
 * @returns Promise<Response>
 */
export async function put(url: string, data?: any, options: FetchOptions = {}): Promise<Response> {
  return authenticatedFetch(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Authenticated DELETE request
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Promise<Response>
 */
export async function del(url: string, options: FetchOptions = {}): Promise<Response> {
  return authenticatedFetch(url, { ...options, method: 'DELETE' });
}

/**
 * Authenticated PATCH request
 * @param url - The URL to fetch
 * @param data - Data to send in request body
 * @param options - Fetch options
 * @returns Promise<Response>
 */
export async function patch(url: string, data?: any, options: FetchOptions = {}): Promise<Response> {
  return authenticatedFetch(url, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Helper to parse JSON response with error handling
 * @param response - The fetch Response object
 * @returns Parsed JSON data
 */
export async function parseJSON<T = any>(response: Response): Promise<T> {
  try {
    return await response.json();
  } catch (error) {
    console.error('Error parsing JSON response:', error);
    throw new Error('Invalid JSON response from server');
  }
}

/**
 * Helper to handle API errors with detailed error messages
 * @param response - The fetch Response object
 * @returns Error message string
 */
export async function getErrorMessage(response: Response): Promise<string> {
  let errorMessage = `HTTP error! status: ${response.status}`;
  
  try {
    const errorData = await response.json();
    if (errorData.error) {
      errorMessage = errorData.error;
    } else if (errorData.message) {
      errorMessage = errorData.message;
    } else if (errorData.detail) {
      errorMessage = errorData.detail;
    }
  } catch (e) {
    // If we can't parse the error response, use the generic message
    console.warn('Could not parse error response:', e);
  }
  
  return errorMessage;
}

/**
 * Complete API call with automatic error handling and JSON parsing
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Parsed JSON data
 */
export async function apiCall<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
  const response = await authenticatedFetch(url, options);
  
  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }
  
  return parseJSON<T>(response);
}

