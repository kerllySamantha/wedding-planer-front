import { Inject, Injectable } from '@angular/core';
import { Notificacion, NotificacionResponse } from '../../Interfaces/Notificacion';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paginated } from '../Paginated';

@Injectable({
  providedIn: 'root',
})
export abstract class NotificacionesService {


abstract getNotificaciones(user_id: number, page: number): Observable<Paginated<Notificacion>>;
abstract getNotificacion(idNotificacion: number): Observable<NotificacionResponse>;
abstract marcarLeida(idNotificacion: number): Observable<NotificacionResponse>;


}
