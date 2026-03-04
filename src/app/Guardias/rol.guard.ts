import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const rolGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const role = localStorage.getItem('rol');
  const allowed: string[] = route.data?.['rol'] ?? [];

  if (!role) return router.parseUrl('/dashboard-empresas');
  if (allowed.length > 0 && !allowed.includes(role)) {
    if (role === 'empresa') return router.parseUrl('/proveedor-dashboard');
    if (role === 'usuario') return router.parseUrl('/dashboard');
    return router.parseUrl('/dashboard-empresas');
  }
  return true;
};
