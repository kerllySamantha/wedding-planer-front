import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { AuthenticationService } from './authenticationService';
import { map, Observable, switchMap, tap } from 'rxjs';
import { API_URL } from '../../Tokens/serviceTokens';
import { UserResponse } from '../../Interfaces/User';

@Injectable({
  providedIn: 'root'
})
export class AutenticarHttpClientService extends AuthenticationService {

  constructor(
    protected http: HttpClient,
    @Inject(API_URL) public apiUrl: string
  ) {
    super();
  }

  /**
   * Obtener cookie CSRF de Sanctum
   */
  private csrf() {
    const apiBaseUrl = this.apiUrl.replace(/\/api\/?$/, '');
    return this.http.get(`${apiBaseUrl}/sanctum/csrf-cookie`, {
      withCredentials: true
    });
  }

  /**
   * LOGIN (SANCTUM con cookies)
   */
  login(email: string | null, password: string | null): Observable<UserResponse> {
    return this.csrf().pipe(
      switchMap(() =>
        this.http.post<UserResponse>(
          `${this.apiUrl}/login`,
          { email, password },
          { withCredentials: true }
        )
      ),
      tap(response => {
        // ✅ Guardamos usuario en memoria (NO token)
        this.auth.set(response.data);

        // ❌ ELIMINADO: token (NO usar Bearer con Sanctum SPA)
        // localStorage.setItem('token', response.token);
      })
    );
  }

  /**
   * LOGOUT
   */
  logout(): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/logout`,
      {},
      { withCredentials: true }
    ).pipe(
      tap(() => {
        // limpiar estado en memoria
        this.auth.set(undefined);

        // limpiar storage si usas algo
        localStorage.removeItem('user');
        localStorage.removeItem('id');
        localStorage.removeItem('nombre');
        localStorage.removeItem('rol');
      }),
      map(() => undefined)
    );
  }
}