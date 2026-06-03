import { Service, Category, ApiResponse, CreateServiceDto } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }
  return response.json();
};

export const fetchServices = async (
  page = 1,
  perPage = 8,
  search = '',
  categoryId?: number
): Promise<ApiResponse<Service[]>> => {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    search,
    ...(categoryId && { category_id: String(categoryId) })
  });

  const response = await fetch(`${API_BASE_URL}/services?${params}`);
  return handleResponse<ApiResponse<Service[]>>(response);
};

export const fetchCategories = async (): Promise<ApiResponse<Category[]>> => {
  const response = await fetch(`${API_BASE_URL}/categories`);
  return handleResponse<ApiResponse<Category[]>>(response);
};

export const createService = async (
  serviceData: CreateServiceDto
): Promise<ApiResponse<Service>> => {
  const formData = new FormData();
  formData.append('title', serviceData.title);
  formData.append('description', serviceData.description);
  
  if (serviceData.image instanceof File) {
    formData.append('image', serviceData.image);
  } else {
    formData.append('image_url', serviceData.image);
  }

  if (serviceData.category_id) {
    formData.append('category_id', String(serviceData.category_id));
  }

  const response = await fetch(`${API_BASE_URL}/services`, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  return handleResponse<ApiResponse<Service>>(response);
};