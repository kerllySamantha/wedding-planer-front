import { Inject, Injectable } from '@angular/core';
import { MensajesServiceServiceService } from './mensajes-service-service.service';
import { catchError, map, Observable, throwError } from 'rxjs';
import { Mensajes, Mensaje, CreateMensaje } from '../../Interfaces/Mensaje';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../Tokens/serviceTokens';

@Injectable({
  providedIn: 'root'
})
export class MebsajesApiServiceService extends MensajesServiceServiceService {

  constructor(protected http: HttpClient, @Inject(API_URL) public apiUrl: string) {
    super();
  }

  override getMensajes(): Observable<Mensajes | null> {
    return this.http.get<Mensajes>(`${this.apiUrl}/mensajes`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      })
    );
  }
  override getMensaje(idMensaje: bigint): Observable<Mensaje | null> {
    console.log("idMensaje: " + idMensaje);

    return this.http.get<Mensaje>(`${this.apiUrl}/mensajes/${idMensaje.toString()}`).pipe(
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
  override postMensaje(mensaje: CreateMensaje): Observable<Mensaje | null> {
    const postObject = {
      "emisor_id": `${mensaje.emisor_id}`,
      "receptor_id": `${mensaje.receptor_id}`,
      "contenido": `${mensaje.contenido}`,

    }
    return this.http.post<Mensaje>(`${this.apiUrl}/mensajes`, postObject);
  }


  override editarMensaje(idMensaje: string | null, mensaje: CreateMensaje): Observable<Object | null> {
    const putObject = {
      "emisor_id": `${mensaje.emisor_id}`,
      "receptor_id": `${mensaje.receptor_id}`,
      "contenido": `${mensaje.contenido}`,
    }
    console.log(putObject)
    return this.http.put(`${this.apiUrl}/users/${idMensaje}`, putObject)
  }


  override deleteMensaje(idMensaje: bigint): Observable<Object | null> {
    return this.http.delete(`${this.apiUrl}/mensajes/${idMensaje.toString()}`);
  }


}
