import { Inject, Injectable } from '@angular/core';
import { TiposHttpService } from './tipos-http.service';
import { CreateTipo, TipoCategoria, TipoData, Tipos, TipoSimple } from '../../Interfaces/Tipos';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../Tokens/serviceTokens';
import { Reserva } from '../../Interfaces/Reserva';
import { CategoriaSimple } from '../../Interfaces/Categoria';

@Injectable({
  providedIn: 'root'
})
export class TiposApiService extends TiposHttpService {


  constructor(protected http: HttpClient, @Inject(API_URL) public apiUrl: string) {
    super();
  }

  override getTipos(): Observable<Tipos | null> {
    return this.http.get<Tipos>(`${this.apiUrl}/tipos`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      })
    );
  }
  override getTipo(idTipo: bigint): Observable<TipoData | null> {
    console.log("idTipo: " + idTipo);

    return this.http.get<TipoData>(`${this.apiUrl}/tipos/${idTipo.toString()}`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      }),
      catchError((error: Error) => {
        console.error("Error en getTipo:", error);
        return throwError(() => error);
      })
    );
  }
  override postTipo(tipo:CreateTipo): Observable<CreateTipo | null> {
    const postObject = {
      "id": `${tipo.id}`,
      "nombre": `${tipo.nombre}`,
      "descripcion": `${tipo.description}`,
  

    }
    return this.http.post<CreateTipo>(`${this.apiUrl}/tipos`, postObject);
  }
  override editartipo(idTipo: string | null, tipo:CreateTipo): Observable<Object | null> {
    const putObject = {
      "id": `${tipo.id}`,
      "nombre": `${tipo.nombre}`,
      "descripcion": `${tipo.description}`,
    }
    console.log(putObject)
    return this.http.put(`${this.apiUrl}/tipos/${idTipo}`, putObject)
  }

  override deleteTipo(idTipo: bigint): Observable<Object | null> {
    return this.http.delete(`${this.apiUrl}/tipos/${idTipo.toString()}`);

  }


}
