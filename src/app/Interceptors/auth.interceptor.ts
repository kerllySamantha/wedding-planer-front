import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authToken = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (req.body != null && !req.headers.has('Content-Type')) {
    headers['Content-Type'] = 'application/json';
  }

  const newReq = req.clone({
    setHeaders: headers,
    withCredentials: true,
  });

  return next(newReq);
};
