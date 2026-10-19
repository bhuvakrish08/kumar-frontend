const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function getImageUrl(pathOrUrl) {
  if (!pathOrUrl) return '';

  let cleanPath = pathOrUrl;
  // If stored in DB with http://localhost:5000/uploads/... or http://127.0.0.1:5000/uploads/...
  // strip the domain prefix so it uses the active API_BASE_URL or relative HTTPS path
  if (cleanPath.startsWith('http://localhost:5000') || cleanPath.startsWith('https://localhost:5000') ||
      cleanPath.startsWith('http://127.0.0.1:5000') || cleanPath.startsWith('https://127.0.0.1:5000')) {
    cleanPath = cleanPath.replace(/^https?:\/\/(localhost|127\.0\.0\.1):5000/, '');
  }

  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    // If page is HTTPS but URL is HTTP, attempt protocol upgrade to avoid Mixed Content
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && cleanPath.startsWith('http://')) {
      return cleanPath.replace(/^http:\/\//, 'https://');
    }
    return cleanPath;
  }

  const base = API_BASE_URL.replace(/\/+$/, '');
  const formattedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;

  let fullUrl = `${base}${formattedPath}`;
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && fullUrl.startsWith('http://')) {
    fullUrl = fullUrl.replace(/^http:\/\//, 'https://');
  }

  return fullUrl;
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

/**
 * Executes a streaming fetch with real-time SSE event updates
 */
export async function apiStreamFetch(endpoint, options = {}, onProgress = null) {
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
    'Accept': 'text/event-stream, application/json',
    ...(options.headers || {})
  };

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

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/event-stream') || !response.body) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || data?.message || `Request failed with status ${response.status}`);
    }
    return data;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalResult = null;
  let streamError = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data:')) {
        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr) continue;
        try {
          const evt = JSON.parse(jsonStr);
          if (evt.stage === 'ERROR') {
            streamError = new Error(evt.message || 'Analysis failed');
          }
          if (onProgress && typeof onProgress === 'function') {
            onProgress(evt);
          }
          if (evt.data) {
            finalResult = evt.data;
          }
        } catch {
          // ignore chunk parse failure
        }
      }
    }
  }

  if (streamError) {
    throw streamError;
  }

  if (!finalResult) {
    throw new Error('Incomplete response received from server');
  }

  return finalResult;
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
