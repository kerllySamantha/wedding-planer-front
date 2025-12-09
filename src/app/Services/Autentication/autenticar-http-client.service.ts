import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { AuthenticationService } from './authenticationService';
import { map, Observable, tap } from 'rxjs';
import { API_URL } from '../../Tokens/serviceTokens';
import { User, UserResponse } from '../../Interfaces/User';


@Injectable({
  providedIn: 'root'
})
export class AutenticarHttpClientService extends AuthenticationService {
  constructor(protected http: HttpClient, @Inject(API_URL) public apiUrl: string) {
    super();
    
  }


  login(email: string | null, password: string | null): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        this.auth.set(response.data);
      })
    );
  }



  logout(): Observable<void> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this.auth.set(undefined)),
      map(() => {
        undefined;
        localStorage.removeItem('user');
        // localStorage.removeItem('token');
        localStorage.removeItem('id');
        localStorage.removeItem('nombre');
        localStorage.removeItem('rol');
        this.auth.set(undefined);

      })
    );
  }
}
