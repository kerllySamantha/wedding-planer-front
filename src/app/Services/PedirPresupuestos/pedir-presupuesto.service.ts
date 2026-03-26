import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AceptarPresupuestoResponse, PedirPresupuestoInfo, PedirPresupuestoStore, ResponderPresupuestoPayload } from '../../Interfaces/PedirPresupuesto';

@Injectable({
  providedIn: 'root',
})
export abstract class PedirPresupuestoService {
  abstract getPedirPresupuestos(): Observable<PedirPresupuestoInfo[] | null>
  abstract getPedirPresupuesto(idPresupuesto: string): Observable<PedirPresupuestoInfo | null>
  abstract storePedirPresupuesto(pedirPresup: PedirPresupuestoStore): Observable<PedirPresupuestoStore | null>
  abstract getEmpresaPedirPresupuesto(idEmpresa: string): Observable<PedirPresupuestoInfo[] | null>;
  abstract aceptarPresupuesto(idPresupuesto: string | number): Observable<AceptarPresupuestoResponse | null>;
  abstract responderPresupuesto(idPresupuesto: string | number, payload: ResponderPresupuestoPayload): Observable<PedirPresupuestoInfo | null>;
  abstract rechazarPresupuesto(id: string | number): Observable<PedirPresupuestoInfo | null>;


}
