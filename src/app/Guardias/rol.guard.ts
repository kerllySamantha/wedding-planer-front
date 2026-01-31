import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const rolGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const role = localStorage.getItem('rol');
  const allowed: string[] = route.data?.['rol'] ?? [];

  console.log('rol:', role, 'allowed:', allowed);

  if (state.url === '/' || state.url === '') {
    if (role === 'empresa') return router.parseUrl('/proveedor-dashboard');
    return router.parseUrl('/dashboard');  
  }

  return true;
};
