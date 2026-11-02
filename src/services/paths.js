const BASE_PATH = import.meta.env.BASE_URL;

export const HOME_PATH = BASE_PATH;

export function isAdminPath(pathname = window.location.pathname) {
  const basePath = BASE_PATH === '/' ? '' : BASE_PATH.replace(/\/$/, '');
  const adminPath = `${basePath}/admin`;
  return pathname === adminPath || pathname.startsWith(`${adminPath}/`);
}

export function withBasePath(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || BASE_PATH === '/') return path;
  if (path === BASE_PATH.slice(0, -1) || path.startsWith(BASE_PATH)) return path;
  return `${BASE_PATH}${path.slice(1)}`;
}
