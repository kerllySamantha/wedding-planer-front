import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const rolredirectGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const role = localStorage.getItem('rol');

  console.log('REDIRECT-GUARD role:', role);

  if (state.url === '/' || state.url === '') {

    if (role === 'empresa') {
      return router.parseUrl('/proveedor-dashboard');
    }

    if (role === 'usuario') {
      return router.parseUrl('/dashboard');
    }

    return router.parseUrl('/dashboard');
  }

  return true;
};
