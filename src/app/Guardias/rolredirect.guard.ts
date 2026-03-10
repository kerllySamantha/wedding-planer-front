import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { APP_PATHS } from '../app.paths';

export const rolredirectGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const role = localStorage.getItem('rol');
  const dashboardUrl = `/${APP_PATHS.home}`;
  const providerDashboardUrl = `/${APP_PATHS.providerDashboard}`;

  if (state.url === '/' || state.url === '') {

    if (role === 'empresa') {
      return router.parseUrl(providerDashboardUrl);
    }

    if (role === 'usuario') {
      return router.parseUrl(dashboardUrl);
    }

    return router.parseUrl(dashboardUrl);
  }

  return true;
};
