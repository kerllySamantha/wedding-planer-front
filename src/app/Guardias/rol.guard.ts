import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { APP_PATHS } from '../app.paths';

export const rolGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const role = localStorage.getItem('rol');
  const allowed: string[] = route.data?.['rol'] ?? [];
  const dashboardUrl = `/${APP_PATHS.home}`;
  const providerDashboardUrl = `/${APP_PATHS.providerDashboard}`;

  if (!role) return router.parseUrl(dashboardUrl);
  if (allowed.length > 0 && !allowed.includes(role)) {
    if (role === 'empresa') return router.parseUrl(providerDashboardUrl);
    if (role === 'usuario') return router.parseUrl(dashboardUrl);
    return router.parseUrl(dashboardUrl);
  }
  return true;
};
