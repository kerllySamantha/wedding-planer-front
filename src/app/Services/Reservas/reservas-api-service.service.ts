import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { API_URL } from '../../Tokens/serviceTokens';
import { ReservasServiceServiceService } from './reservas-service-service.service';
import { CreateReserva, Reserva, Reservas } from '../../Interfaces/Reserva';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReservasApiServiceService extends ReservasServiceServiceService {
 

  constructor(protected http: HttpClient, @Inject(API_URL) public apiUrl: string) {
    super();
  }

  override getReservas(): Observable<Reservas | null> {
    return this.http.get<Reservas>(`${this.apiUrl}/reservas`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      })
    );
  }
  override getReserva(idReserva: bigint): Observable<Reserva | null> {
    console.log("idReserva: " + idReserva);

    return this.http.get<Reserva>(`${this.apiUrl}/reservas/${idReserva.toString()}`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      }),
      catchError((error: Error) => {
        console.error("Error en getReserva:", error);
        return throwError(() => error);
      })
    );
  }
  override postReserva(reserva: CreateReserva): Observable<CreateReserva | null> {
    const postObject = {
      "empresa_id": `${reserva.empresa_id}`,
      "user_id": `${reserva.user_id}`,
      "fecha": `${reserva.fecha}`,
      "estado": `${reserva.estado}`,

    }
    return this.http.post<CreateReserva>(`${this.apiUrl}/reservas`, postObject);
  }
  override editarReserva(idReserva: string | null, reserva: CreateReserva): Observable<Object | null> {
    const putObject = {
      "empresa_id": `${reserva.empresa_id}`,
      "user_id": `${reserva.user_id}`,
      "fecha": `${reserva.fecha}`,
      "estado": `${reserva.estado}`,
    }
    console.log(putObject)
    return this.http.put(`${this.apiUrl}/reservas/${idReserva}`, putObject)
  }

  override deleteReseerva(idReserva: bigint): Observable<Object | null> {
    return this.http.delete(`${this.apiUrl}/reservas/${idReserva.toString()}`);

  }

  override getRersevaPorConfirmar(idEmresa: string, estado: string): Observable<Reservas | null> {
    return this.http.get<Reservas>(`${this.apiUrl}/reservas/empresa/${idEmresa}/estado/${estado}`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      })
    );
  }

  override getReservaEmpresa(idEmresa: string): Observable<Reservas | null> {
    return this.http.get<Reservas>(`${this.apiUrl}/reservas/empresa/${idEmresa}`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      })
    );
  }

}
