import { Injectable } from '@angular/core';
import { CreateReserva, Reserva, Reservas } from '../../Interfaces/Reserva';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export abstract class ReservasServiceServiceService {

  constructor() { }


  abstract getReservas(): Observable<Reservas | null>;
  abstract getReserva(idRerserva: bigint): Observable<Reserva | null>;
  abstract postReserva(reserva: CreateReserva): Observable<CreateReserva | null>;
  abstract editarReserva(idRerserva: string | null, usuario: CreateReserva): Observable<Object | null>;
  abstract deleteReseerva(idRerserva: bigint): Observable<Object | null>;
  abstract getRersevaPorConfirmar(idEmresa: string, estado: string): Observable<Reservas | null>;
  abstract getReservaEmpresa(idEmresa: string): Observable<Reservas | null>
}
