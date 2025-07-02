/**
 * API services for providers
 */
import { apiClient } from '../api-client';

/**
 * Fetches the list of available providers
 * @returns A promise that resolves to an array of provider names
 */
export async function getProviders(): Promise<string[]> {
  return apiClient<string[]>('/cloud-providers');
}