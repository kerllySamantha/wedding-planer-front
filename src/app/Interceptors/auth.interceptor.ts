import { HttpInterceptorFn, HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";
import { AuthenticationService } from "../Services/Autentication/authenticationService";
import { APP_PATHS } from "../app.paths";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authToken = localStorage.getItem('token');
  const router = inject(Router);
  const authService = inject(AuthenticationService);

  const newReq = req.clone({
    setHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    }
  });

  return next(newReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && authToken) {
        const rol = localStorage.getItem('rol');
        localStorage.clear();
        authService.auth.set(undefined);
        const loginPath = rol === 'empresa' ? APP_PATHS.loginEmpresa : APP_PATHS.login;
        router.navigate([`/${loginPath}`]);
      }
      return throwError(() => error);
    })
  );
};
