/** Tiny hash router for the admin console (the user app uses screen state, not URLs). */

export function go(path: string): void {
  window.location.hash = `#/${path}`;
}

export interface Route {
  page: string;
  param?: string;
  sub?: string;
}

export function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, '');
  const [page, param, sub] = h.split('/');
  return { page: page || 'dashboard', param, sub };
}
