const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function getImageUrl(pathOrUrl) {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const base = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${cleanPath}`;
}

export async function apiFetch(endpoint, options = {}) {
  let url;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    url = endpoint;
  } else {
    const base = API_BASE_URL.replace(/\/+$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    if (base.endsWith('/api/v1')) {
      url = `${base}${cleanEndpoint}`;
    } else if (cleanEndpoint.startsWith('/api/v1/')) {
      url = `${base}${cleanEndpoint}`;
    } else {
      url = `${base}/api/v1${cleanEndpoint}`;
    }
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Strictly use secure HttpOnly cookies (credentials: 'include') - no token in localStorage
  const response = await fetch(url, {
    ...options,
    headers: defaultHeaders,
    credentials: 'include'
  });

  if (
    response.status === 401 &&
    typeof window !== 'undefined' &&
    window.location.pathname !== '/' &&
    window.location.pathname !== '/login'
  ) {
    window.location.href = '/';
    throw new Error('Unauthorized');
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
      data?.message ||
      `Request failed with status ${response.status}`
    );
  }

  return data;
}

export async function apiUploadFile(file) {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const url = base.endsWith('/api/v1') ? `${base}/upload` : `${base}/api/v1/upload`;
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || 'File upload failed');
  }

  return data;
}
