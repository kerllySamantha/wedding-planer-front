import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PedirPresupuestoInfo, PedirPresupuestoStore } from '../../Interfaces/PedirPresupuesto';

@Injectable({
  providedIn: 'root',
})
export abstract class PedirPresupuestoService {
  abstract getPedirPresupuestos(): Observable<PedirPresupuestoInfo[] | null>
  abstract getPedirPresupuesto(idPresupuesto: string): Observable<PedirPresupuestoInfo | null>
  abstract storePedirPresupuesto(pedirPresup: PedirPresupuestoStore): Observable<PedirPresupuestoStore | null>
  abstract getEmpresaPedirPresupuesto(idEmpresa: string): Observable<PedirPresupuestoInfo[] | null>;

}
