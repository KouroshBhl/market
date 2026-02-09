import type { AuthUser } from '@workspace/contracts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ============================================
// In-memory token store (SSR-safe)
// ============================================

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  if (accessToken) return accessToken;
  // Fallback to localStorage for page refreshes
  return localStorage.getItem('access_token');
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }
}

export function clearAccessToken(): void {
  setAccessToken(null);
}

// ============================================
// Auth API helpers
// ============================================

export async function apiSignup(email: string, password: string): Promise<{ accessToken: string; expiresIn: number }> {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Signup failed');
  }

  const data = await res.json();
  setAccessToken(data.accessToken);
  return data;
}

export async function apiLogin(email: string, password: string): Promise<{ accessToken: string; expiresIn: number }> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Login failed');
  }

  const data = await res.json();
  setAccessToken(data.accessToken);
  return data;
}

export async function apiRefresh(): Promise<{ accessToken: string; expiresIn: number } | null> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) {
      clearAccessToken();
      return null;
    }

    const data = await res.json();
    setAccessToken(data.accessToken);
    return data;
  } catch {
    clearAccessToken();
    return null;
  }
}

export async function apiLogout(): Promise<void> {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Ignore errors on logout
  }
  clearAccessToken();
}

export async function apiGetMe(): Promise<AuthUser | null> {
  const token = getAccessToken();
  if (!token) return null;

  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  });

  if (!res.ok) {
    if (res.status === 401) {
      // Try refresh
      const refreshed = await apiRefresh();
      if (refreshed) {
        const retryRes = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${refreshed.accessToken}` },
          credentials: 'include',
        });
        if (retryRes.ok) {
          const data = await retryRes.json();
          return data.user;
        }
      }
      clearAccessToken();
      return null;
    }
    return null;
  }

  const data = await res.json();
  return data.user;
}

export async function apiExchangeCode(code: string): Promise<{ accessToken: string; expiresIn: number }> {
  const res = await fetch(`${API_URL}/auth/exchange-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Code exchange failed');
  }

  const data = await res.json();
  setAccessToken(data.accessToken);
  return data;
}

export async function apiSellerSetup(displayName: string) {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_URL}/seller/setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({ displayName }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Seller setup failed');
  }

  return res.json();
}

// ============================================
// Email Verification
// ============================================

export async function apiResendVerification(): Promise<{ ok: true }> {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_URL}/auth/resend-verification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to send verification email');
  }

  return res.json();
}

// ============================================
// Password Management
// ============================================

export async function apiSetPassword(newPassword: string): Promise<{ ok: true }> {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_URL}/auth/set-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({ newPassword }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to set password');
  }

  return res.json();
}

export async function apiChangePassword(oldPassword: string, newPassword: string): Promise<{ ok: true }> {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({ oldPassword, newPassword }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to change password');
  }

  return res.json();
}

// ============================================
// Authed fetch helper (for API client)
// ============================================

export async function authedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token = getAccessToken();

  const doFetch = (t: string | null) =>
    fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
      },
      credentials: 'include',
    });

  let res = await doFetch(token);

  if (res.status === 401 && token) {
    // Try refresh
    const refreshed = await apiRefresh();
    if (refreshed) {
      token = refreshed.accessToken;
      res = await doFetch(token);
    }
  }

  return res;
}
