/**
 * API services for icons
 */
import {apiClient} from '@/api';
import {Icon} from '@/types/icon';

export interface IconsResponse {
    data: Icon[];
    total: number;
    page: number;
    pageSize: number;
}

export interface GetIconsParams {
    provider: string;
    page?: number;
    pageSize?: number;
    size?: string;
    search?: string;
    tags?: string[];
}

/**
 * Fetches icons based on the provided parameters
 * @param params The parameters to use for fetching icons
 * @returns A promise that resolves to the icons response
 */
export async function getIcons({
                                   provider,
                                   page = 1,
                                   pageSize = 50,
                                   size = 'medium',
                                   search,
                                   tags,
                               }: GetIconsParams): Promise<IconsResponse> {
    return apiClient<IconsResponse>(`/${provider}/icons`, {
        params: {
            page,
            pageSize,
            size,
            search,
            tags: tags?.length ? tags.join(',') : undefined,
        },
    });
}

/**
 * Fetches a single icon by its ID
 * @param provider The provider of the icon
 * @param iconId The ID of the icon
 * @returns A promise that resolves to the icon
 */
export async function getIconById(provider: string, iconId: string): Promise<Icon> {
    return apiClient<Icon>(`/${provider}/icon/${iconId}`);
}