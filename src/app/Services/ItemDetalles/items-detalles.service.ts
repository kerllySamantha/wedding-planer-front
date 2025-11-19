import { Injectable } from '@angular/core';
import { ItemsDetalleCreate, PresupuestoCreate, PresupuestoItem, PresupuestoItems } from '../../Interfaces/Presupuesto';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export abstract class ItemsDetallesService {

  constructor() { }


  abstract getItemsDetalles(): Observable<PresupuestoItem[] | null>;
  abstract getDetalles(idDetalle: bigint): Observable<PresupuestoItem | null>;
  abstract postDetalles(detalles: ItemsDetalleCreate): Observable <PresupuestoItem | null>;
  abstract editarDetalles(idDetalle: number | null, detalle: ItemsDetalleCreate): Observable<PresupuestoItem | null>;
  abstract deleteDetalle(idDetalle: bigint): Observable<Object | null>;
  abstract getDetallesPorPresupuesto(presupuestoId: number): Observable<PresupuestoItems | null>
}
