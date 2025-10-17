import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authToken = localStorage.getItem('token');

  const newReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${authToken}`
    }
  });

  return next(newReq);
};
