const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const backendRoutes = {
  healthcheck: '/',
  login: '/auth/login',
  createUser: '/users',
  me: '/users/me',
  adminArea: '/admin',
  usersAdminList: '/users',
} as const;

export async function backendFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
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
    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}
