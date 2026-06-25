export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export enum Role {
  USER = 'USER',
  ORGANIZER = 'ORGANIZER',
  ADMIN = 'ADMIN',
}

export interface UserResponseDto {
  id: number;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  role: Role;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
  cnpj?: string;
  cep?: string;
  createdAt: string;
}

export const backendRoutes = {
  healthcheck: '/',
  login: '/auth/login',
  createUser: '/users',
  me: '/users/me',
  updateMe: '/users/me',
  adminArea: '/admin',
  usersAdminList: '/users',
  events: '/events',
  myEvents: '/events/my-events',
  cities: '/cities',
  eventDetails: (id: string | number) => `/events/${id}`,
  eventParticipants: (id: string | number) => `/events/${id}/participants`,
  joinEvent: (id: string | number) => `/events/${id}/join`,
  uploadEventImage: (id: string | number) => `/events/${id}/upload`,
  eventMessages: (id: string | number) => `/events/${id}/messages`,
  promoteEvent: (id: string | number) => `/events/${id}/promote`,
  promotedEvents: '/events/promoted',
  checkoutPromotion: '/payments/checkout-promotion',
  checkoutSession: '/payments/checkout-session',
} as const;

export async function backendFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers);

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Only set Content-Type to JSON if it's not FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'Falha na comunicação com o back-end';
    try {
      const errorPayload = await response.json();
      errorMessage = errorPayload.message || errorPayload.error || errorMessage;
    } catch {
      const textMessage = await response.text();
      errorMessage = textMessage || errorMessage;
    }
    throw new Error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
  }

  // If response is 204 No Content, return empty object or null
  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export function getImageUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('/uploads')) {
    return `${API_BASE_URL}${url}`;
  }
  return url;
}


