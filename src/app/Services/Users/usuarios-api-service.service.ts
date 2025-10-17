import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { UsuariosServiceService } from './usuarios-service.service';
import { catchError,map, Observable, throwError } from 'rxjs';
import { API_URL } from '../../Tokens/serviceTokens';
import { CreateUser, User, UserResponse, Usuarios } from '../../Interfaces/User';

@Injectable({
  providedIn: 'root'
})
export class UsuariosApiServiceService extends UsuariosServiceService {
  constructor(protected http: HttpClient, @Inject(API_URL) public apiUrl: string) {
    super();
  }

  override getUsuarios(): Observable<Usuarios | null> {
    return this.http.get<Usuarios>(`${this.apiUrl}/users`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      })
    );
  }

  override getUsuario(idUsuario: bigint): Observable<UserResponse | null> {
    console.log("idUsuario: " + idUsuario);

    return this.http.get<UserResponse>(`${this.apiUrl}/users/${idUsuario.toString()}`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      }),
      catchError((error: Error) => {
        console.error("Error en getUsuario:", error);
        return throwError(() => error);
      })
    );
  }

  override postUsuario(usuario: CreateUser): Observable<UserResponse | null> {
    const postObject = {
      "name": `${usuario.name}`,
      "email": `${usuario.email}`,
      "password": `${usuario.password}`,
      "rol": `${usuario.rol}`

    }
    return this.http.post<UserResponse>(`${this.apiUrl}/users`, postObject);
  }



  override putUsuarioEditar(idUsuario: string, usuario: CreateUser): Observable<Object | null> {
    const putObject = {
      "name": `${usuario.name}`,
      "email": `${usuario.email}`,
      "password": `${usuario.password}`,
    }
    console.log(putObject)
    return this.http.put(`${this.apiUrl}/users/${idUsuario}`, putObject)
  }

  override deleteUsuario(idUsuario: bigint): Observable<Object | null> {
    return this.http.delete(`${this.apiUrl}/users/${idUsuario.toString()}`);
  }

}
