/** Client HTTP JobSwipe. Le serveur est la seule source de vérité. */
const ROOT = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'jobswipe.token';

export function token() { return localStorage.getItem(TOKEN_KEY); }
export function saveToken(value) { if (value) localStorage.setItem(TOKEN_KEY, value); else localStorage.removeItem(TOKEN_KEY); }

export async function request(path, { method = 'GET', data, signal, blob = false } = {}) {
  const headers = {};
  if (token()) headers.Authorization = `Bearer ${token()}`;
  if (data !== undefined && !(data instanceof FormData)) headers['Content-Type'] = 'application/json';
  let response;
  try {
    response = await fetch(`${ROOT}${path}`, {
      method, headers, signal,
      body: data instanceof FormData ? data : data !== undefined ? JSON.stringify(data) : undefined,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Connexion au serveur impossible. Vérifiez que le backend fonctionne.');
  }
  if (response.status === 401 && token()) window.dispatchEvent(new Event('jobswipe:expired'));
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || `Erreur du serveur (${response.status}).`);
  }
  if (blob) return response.blob();
  if (response.status === 204) return null;
  return response.json();
}
export const api = {
  get: (p, options) => request(p, options),
  post: (p, data) => request(p, { method: 'POST', data }),
  patch: (p, data) => request(p, { method: 'PATCH', data }),
  delete: p => request(p, { method: 'DELETE' }),
  blob: p => request(p, { blob: true }),
};
export function query(params) {
  const entries = Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null);
  return new URLSearchParams(entries).toString();
}
export async function viewPrivateFile(path) {
  // Ouvrir l'onglet pendant le clic : évite son blocage après un fetch asynchrone.
  const tab = window.open('about:blank', '_blank');
  try {
    const file = await api.blob(path);
    const objectUrl = URL.createObjectURL(file);
    if (tab) tab.location.replace(objectUrl);
    else {
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = path.includes('logo') ? 'logo.png' : 'CV.pdf';
      anchor.click();
    }
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  } catch(error) {
    tab?.close();
    throw error;
  }
}

export async function listAllJobs(filters = {}) {
  const jobs = [];
  let current = 1;
  let totalPages = 1;
  do {
    const result = await api.get(`/jobs?${query({ ...filters, limit: 50, page: current })}`);
    jobs.push(...(result.jobOffers || []));
    totalPages = result.pagination?.totalPages || 1;
    current += 1;
    if (current > 100) throw new Error('Trop d’offres à afficher (plus de 5 000). Contactez l’administrateur.');
  } while (current <= totalPages);
  return jobs;
}
