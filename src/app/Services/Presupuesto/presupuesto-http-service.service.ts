import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Presupuesto, PresupuestoCreate, Presupuestos, PresupuestosBoda } from '../../Interfaces/Presupuesto';

@Injectable({
  providedIn: 'root'
})
export abstract class PresupuestoHttpService {

  constructor() { }
  abstract getPresupuestos(): Observable<Presupuestos | null>;
  abstract getPresupuesto(idPresupuesto: number): Observable<Presupuesto | null>;
  abstract postPresupuesto(presupuesto: PresupuestoCreate): Observable<Presupuesto| null>;
  abstract editarPresupuesto(idPresupuesto: number | null, presupuesto: PresupuestoCreate): Observable<Object | null>;
  abstract deletePresupuesto(idPresupuesto: bigint): Observable<Object | null>;
  abstract getPresupuestosByBoda(bodaId: number):Observable<PresupuestosBoda| null>

}
