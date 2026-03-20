import { Inject, Injectable } from '@angular/core';
import { ItemsDetallesService } from './items-detalles.service';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ItemsDetalleCreate, PresupuestoCreate, PresupuestoItem, PresupuestoItems } from '../../Interfaces/Presupuesto';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../Tokens/serviceTokens';

@Injectable({
  providedIn: 'root'
})
export class ItemsDetallesApiService extends ItemsDetallesService {

  constructor(protected http: HttpClient, @Inject(API_URL) public apiUrl: string) {
    super();
  }


  override getItemsDetalles(): Observable<PresupuestoItem[] | null> {
    return this.http.get<PresupuestoItem[]>(`${this.apiUrl}/detalles`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      }))
  }


  override getDetalles(idDetalle: bigint): Observable<PresupuestoItem | null> {
    console.log("idDetalle: " + idDetalle);

    return this.http.get<PresupuestoItem>(`${this.apiUrl}/detalles/${idDetalle.toString()}`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      }),
      catchError((error: Error) => {
        console.error("Error en getDetalle:", error);
        return throwError(() => error);
      })
    );
  }
  override postDetalles(detalles: ItemsDetalleCreate): Observable<PresupuestoItem | null> {
    const postObject = {
      presupuesto_id: detalles.presupuesto_id,
      categoria_id: detalles.categoria_id,
      tipo_producto_id: detalles.tipo_producto_id,
      nombre_categoria_personalizada: detalles.nombre_categoria_personalizada,
      nombre_tipo_personalizado: detalles.nombre_tipo_personalizado,
      monto_estimado: detalles.monto_estimado,
      monto_pagado: detalles.monto_pagado,
      es_personalizado: detalles.es_personalizado,
      notas: detalles.notas,
    };

    return this.http.post<ItemsDetalleCreate>(`${this.apiUrl}/detalles`, postObject);
  }

  override editarDetalles(idDetalle: number| null, detalle: ItemsDetalleCreate): Observable <PresupuestoItem | null> {
    if (!idDetalle) {
      throw new Error('El ID del detalle es requerido para editar.');
    }

    const updateObject = {
      presupuesto_id: detalle.presupuesto_id,
      categoria_id: detalle.categoria_id,
      tipo_producto_id: detalle.tipo_producto_id,
      nombre_categoria_personalizada: detalle.nombre_categoria_personalizada,
      nombre_tipo_personalizado: detalle.nombre_tipo_personalizado,
      monto_estimado: detalle.monto_estimado,
      monto_pagado: detalle.monto_pagado,
      es_personalizado: detalle.es_personalizado,
      notas: detalle.notas,
      
    };

    return this.http.put<ItemsDetalleCreate>(`${this.apiUrl}/detalles/${idDetalle}`, updateObject);
  }
  

  override deleteDetalle(idDetalle: bigint): Observable<Object | null> {
    return this.http.delete(`${this.apiUrl}/detalles/${idDetalle.toString()}`);
  }

  getDetallesPorPresupuesto(presupuestoId: number) {
    return this.http.get<PresupuestoItems>(`${this.apiUrl}/detalles/presupuesto/${presupuestoId}`);
  }



}
