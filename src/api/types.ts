export interface Service {
  id: number;
  title: string;
  description: string;
  image: string;
  category_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface CreateServiceDto {
  title: string;
  description: string;
  image: File | string;
  category_id?: number;
}