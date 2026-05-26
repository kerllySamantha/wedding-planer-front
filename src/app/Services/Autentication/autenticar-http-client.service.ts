import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { AuthenticationService } from './authenticationService';
import { map, Observable, tap } from 'rxjs';
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

  login(email: string | null, password: string | null): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        this.auth.set(response.data);
        const foto = (response.data as any).fotoPerfil || (response.data as any).foto_perfil;
        if (foto) this.fotoUrl.set(foto);
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.auth.set(undefined);
        this.fotoUrl.set(null);
        localStorage.clear();
      }),
      map(() => undefined)
    );
  }

  override restoreSession() {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.auth.set(user);
        this.fotoUrl.set(user.fotoPerfil || user.foto_perfil || null);
      } catch {
        localStorage.removeItem('user');
      }
    }
  }
}
