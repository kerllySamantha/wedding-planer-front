import { Inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { NotificacionesService } from './notificaciones.service';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../Tokens/serviceTokens';
import { Paginated } from '../Paginated';
import { Notificacion, NotificacionResponse } from '../../Interfaces/Notificacion';

@Injectable({
  providedIn: 'root',
})
export class NotificacionesApiService extends NotificacionesService {

  constructor(
    protected http: HttpClient,
    @Inject(API_URL) public apiUrl: string  
  ) {
    super();
  }

override getNotificaciones(userId: number, page: number = 1): Observable<Paginated<Notificacion>> {
  return this.http.get<Paginated<Notificacion>>(
    `${this.apiUrl}/notificaciones`,
    { params: { user_id: userId, page } }
  );
}

override getNotificacion(idNotificacion: number): Observable<NotificacionResponse> {
  return this.http.get<NotificacionResponse>(
    `${this.apiUrl}/notificaciones/${idNotificacion}`
  );
}

  override marcarLeida(id: number): Observable<NotificacionResponse> {
    const url = `${this.apiUrl}/notificaciones/${id}`;
    const payload = {
      leido: 1,
      leida: 1,
      read_at: new Date().toISOString(),
    };

    return this.http.patch<NotificacionResponse>(url, payload).pipe(
      catchError((error) => {
        if (error?.status === 404 || error?.status === 405) {
          return this.http.put<NotificacionResponse>(url, payload);
        }
        if (error?.status === 422) {
          return this.http.patch<NotificacionResponse>(url, { leido: 1 }).pipe(
            catchError(() => this.http.put<NotificacionResponse>(url, { leido: 1 }))
          );
        }
        return throwError(() => error);
      })
    );
  }

}
