import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { API_URL } from '../../Tokens/serviceTokens';
import { ReservasServiceServiceService } from './reservas-service-service.service';
import { CreateReserva, Reserva, ReservaEvent, Reservas } from '../../Interfaces/Reserva';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReservasApiServiceService extends ReservasServiceServiceService {



  constructor(protected http: HttpClient, @Inject(API_URL) public apiUrl: string) {
    super();
  }

  private unwrapData<T>(response: T | { data?: T } | null | undefined): T | null {
    if (!response) return null;
    if (typeof response === 'object' && response !== null && Object.prototype.hasOwnProperty.call(response, 'data')) {
      return (response as { data?: T }).data ?? null;
    }
    return response as T;
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
      "fecha_inicio": `${reserva.fecha_inicio}`,
      "fecha_fin": `${reserva.fecha_fin}`,
      "origen": `${reserva.origen}`,
      "notas": `${reserva.notas}`,
      "estado": `${reserva.estado}`,
      "boda_id": `${reserva.boda_id}`

    }
    return this.http.post<CreateReserva>(`${this.apiUrl}/reservas`, postObject);
  }
  override editarReserva(idReserva: string | null, reserva: CreateReserva): Observable<Object | null> {
    const putObject = {
      "empresa_id": `${reserva.empresa_id}`,
      "user_id": `${reserva.user_id}`,
      "fecha_inicio": `${reserva.fecha_inicio}`,
      "fecha_fin": `${reserva.fecha_fin}`,
      "origen": `${reserva.origen}`,
      "notas": `${reserva.notas}`,
      "estado": `${reserva.estado}`,
      "boda_id": `${reserva.boda_id}`
    }
    console.log(putObject)
    return this.http.put(`${this.apiUrl}/reservas/${idReserva}`, putObject)
  }

  override confirmarReserva(idReserva: string | number): Observable<Reserva | null> {
    return this.http.post<Reserva | { data?: Reserva }>(`${this.apiUrl}/reservas/${idReserva}/confirmar`, {}).pipe(
      map(response => this.unwrapData(response)),
      catchError((error: Error) => {
        console.error("Error en confirmarReserva:", error);
        return throwError(() => error);
      })
    );
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

  override getCalendarioEmpresa(idEmpresa: string): Observable<ReservaEvent[] | null> {
    return this.http.get<ReservaEvent[]>(`${this.apiUrl}/reservas/calendario/empresa/${idEmpresa}`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      })
    );
  }



}
