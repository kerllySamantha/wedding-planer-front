import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { API_URL } from '../../Tokens/serviceTokens';
import { PerfilServiceServiceService } from './perfil-service-service.service';
import { CreatePerfilUsuario, Perfiles, PerfilResponse } from '../../Interfaces/Perfil';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PerfilApiServiceService  extends PerfilServiceServiceService{


  constructor(protected http: HttpClient, @Inject(API_URL) public apiUrl: string) {
    super();
  }

  override getPerfiles(): Observable<Perfiles | null> {
    return this.http.get<Perfiles>(`${this.apiUrl}/perfiles`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      })
    );
  }

  override getPerfil(idPerfil: bigint): Observable<PerfilResponse | null> {

    return this.http.get<PerfilResponse>(`${this.apiUrl}/perfiles/${idPerfil.toString()}`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      }),
      catchError((error: Error) => {
        console.error("Error en getPerfil:", error);
        return throwError(() => error);
      })
    );
  }

  override postPerfil(perfil: CreatePerfilUsuario): Observable<CreatePerfilUsuario | null> {
    const postObject = {
      "name": `${perfil.name}`,
      "email": `${perfil.email}`,
      "password": `${perfil.password}`,
      "rol": `${perfil.rol}`,
      "direccion": `${perfil.direccion}`,
      "telefono": `${perfil.telefono}`


    }
    return this.http.post<CreatePerfilUsuario>(`${this.apiUrl}/perfiles`, postObject);
  }



  override editarPerfil(idPerfil: string, perfil: CreatePerfilUsuario): Observable<Object | null> {
    const putObject = {
      "name": `${perfil.name}`,
      "email": `${perfil.email}`,
      "password": `${perfil.password}`,
      "rol": "usuario",
      "direccion": `${perfil.direccion}`,
      "telefono": `${perfil.telefono}`
    }
    return this.http.put(`${this.apiUrl}/perfiles/${idPerfil}`, putObject)
  }

  override deletePresupuesto(idPerfil: bigint): Observable<Object | null> {
    return this.http.delete(`${this.apiUrl}/perfiles/${idPerfil.toString()}`);
  }

   override getPerfilByUserId(usuarioId: number) {
      return this.http.get<PerfilResponse>(`${this.apiUrl}/perfiles/usuario/${usuarioId}`).pipe(
        map(response => {
          if (response) {
            return response;
          }
          return null;
        }),
        catchError((error: Error) => {
          console.error("Error en perfil:", error);
          return throwError(() => error);
        })
      
      );
    }

}
