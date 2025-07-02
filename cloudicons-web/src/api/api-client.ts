/**
 * Base API client for making HTTP requests
 * Handles common functionality like error handling, authentication, etc.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'dev-key';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Makes a fetch request with error handling and authentication
 * @param endpoint The API endpoint to call
 * @param options Request options
 * @returns The response data
 */
export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query parameters
  const url = new URL(`${API_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  console.log('Making API request to:', url.toString());

  // Set default headers
  const headers = new Headers(fetchOptions.headers);
  if (API_KEY) {
    headers.set('X-API-Key', API_KEY);
  }

  try {
    // Make the request
    const response = await fetch(url.toString(), {
      ...fetchOptions,
      headers,
    });

    console.log('API response status:', response.status);

    // Handle rate limiting
    if (response.status === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    // Handle other errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    // Parse and return the response
    const data = await response.json();
    console.log('API response data:', data);

    if (!data) {
      throw new Error('Empty response from API');
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}