const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

export interface RegisterUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  supporterType: string;
  relationshipType: string;
  region: string;
  country: string;
  phone: string;
  status: string;
  acquisitionChannel: string;
  organizationName?: string | null;
}

async function readApiError(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return fallbackMessage;
  }

  const data = await response.json();

  if (typeof data?.detail === 'string' && data.detail.length > 0) {
    return data.detail;
  }

  if (typeof data?.title === 'string' && data.title.length > 0) {
    return data.title;
  }

  if (typeof data?.error === 'string' && data.error.length > 0) {
    return data.error;
  }

  if (Array.isArray(data)) {
    const firstDescription = data.find(
      (item: unknown): item is { description?: string } =>
        typeof item === 'object' && item !== null && 'description' in item
    );

    if (firstDescription?.description) {
      return firstDescription.description;
    }
  }

  return fallbackMessage;
}

export async function registerUser(payload: RegisterUserPayload): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Unable to register user.'));
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Unable to log in.'));
  }
}

export async function logoutUser(): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Unable to log out.'));
  }
}

export async function getAuthSession() {
  const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Unable to load auth session.');
  }

  return response.json();
}