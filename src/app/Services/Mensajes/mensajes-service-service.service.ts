import { Injectable } from '@angular/core';
import { CreateMensaje, Mensaje, Mensajes } from '../../Interfaces/Mensaje';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export abstract class MensajesServiceServiceService {

  constructor() { }

  abstract getMensajes(): Observable<Mensajes | null>;
  abstract getMensaje(idMensaje: bigint): Observable<Mensaje | null>;
  abstract postMensaje(usuario: CreateMensaje): Observable<Mensaje | null>;
  abstract editarMensaje(idMensaje: string | null, mensaje: CreateMensaje): Observable<Object | null>;
  abstract deleteMensaje(idMensaje: bigint): Observable<Object | null>;
}
