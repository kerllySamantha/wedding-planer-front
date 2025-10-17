import { Injectable } from '@angular/core';
import { CreateInvitado, Invitado, Invitados } from '../../Interfaces/Invitado';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export abstract class InvitadosServiceServiceService {

  constructor() { }
  abstract getInvitados(): Observable<Invitados | null>;
  abstract getInvitado(idInvitado: bigint): Observable<Invitado | null>;
  abstract postInvitado(invitado: CreateInvitado): Observable<CreateInvitado | null>;
  abstract editarInvitado(idInvitado: string | null, usuario: CreateInvitado): Observable<Object | null>;
  abstract deleteInvitado(idInvitado: bigint): Observable<Object | null>;
}
