export interface Icon {
  id: string;
  provider: string;
  icon_name: string;
  description: string;
  tags: string[];
  svg_path: string;
  png_path: string;
  license: string;
}

export interface IconWithContent extends Icon {
  svg_content: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  pageSize: number;
  data: T[];
}

export interface ErrorResponse {
  error: string;
}