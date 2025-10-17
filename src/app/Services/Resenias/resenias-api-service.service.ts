import { Inject, Injectable } from '@angular/core';
import { ReseniasServiceServiceService } from './resenias-service-service.service';
import { catchError, map, Observable, throwError } from 'rxjs';
import { Resenias, Resenia, CreateResenia } from '../../Interfaces/Resenia';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../Tokens/serviceTokens';

@Injectable({
  providedIn: 'root'
})


export class ReseniasApiServiceService extends ReseniasServiceServiceService {


  constructor(protected http: HttpClient, @Inject(API_URL) public apiUrl: string) {
    super();
  }

  override getResenias(): Observable<Resenias | null> {
    return this.http.get<Resenias>(`${this.apiUrl}/resenias`).pipe(
      map(response => {
        if (response) {
          console.log(response);
          return response;
        }
        return null;
      })
    );
  }
  override getResenia(idResenia: bigint): Observable<Resenia | null> {
    console.log("idResenia: " + idResenia);

    return this.http.get<Resenia>(`${this.apiUrl}/resenias/${idResenia.toString()}`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      }),
      catchError((error: Error) => {
        console.error("Error en getResenia:", error);
        return throwError(() => error);
      })
    );
  }
  override postResenia(resenia: CreateResenia): Observable<CreateResenia | null> {
    const postObject = {
      "empresa_id": `${resenia.empresa_id}`,
      "user_id": `${resenia.user_id}`,
      "puntuacion": `${resenia.puntuacion}`,
      "comentario": `${resenia.comentario}`,

    }
    return this.http.post<CreateResenia>(`${this.apiUrl}/resenias`, postObject);
  }
  override editarResenia(idResenia: string | null, resenia: CreateResenia): Observable<Object | null> {
    const putObject = {
      "empresa_id": `${resenia.empresa_id}`,
      "user_id": `${resenia.user_id}`,
      "puntuacion": `${resenia.puntuacion}`,
      "comentario": `${resenia.comentario}`,
    }
    console.log(putObject)
    return this.http.put(`${this.apiUrl}/resenias/${idResenia}`, putObject)
  }

  override deleteResenia(idResenia: bigint): Observable<Object | null> {
    return this.http.delete(`${this.apiUrl}/resenias/${idResenia.toString()}`);

  }
}
