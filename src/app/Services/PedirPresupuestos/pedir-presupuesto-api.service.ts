import { Inject, Injectable } from '@angular/core';
import { PedirPresupuestoService } from './pedir-presupuesto.service';
import { catchError, map, Observable, throwError } from 'rxjs';
import { AceptarPresupuestoResponse, PedirPresupuestoInfo, PedirPresupuestoStore, ResponderPresupuestoPayload } from '../../Interfaces/PedirPresupuesto';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../Tokens/serviceTokens';

@Injectable({
  providedIn: 'root',
})
export class PedirPresupuestoApiService extends PedirPresupuestoService {

  
  constructor(protected http: HttpClient, @Inject(API_URL) public apiUrl: string) {
    super();
  }

  private isWrapped<T>(value: T | { data?: T }): value is { data?: T } {
    return typeof value === 'object'
      && value !== null
      && Object.prototype.hasOwnProperty.call(value, 'data');
  }

  private unwrapData<T>(response: T | { data?: T } | null | undefined): T | null {
    if (!response) return null;
    if (this.isWrapped(response)) {
      return response.data ?? null;
    }
    return response;
  }

  private unwrapArray<T>(response: T[] | { data?: T[] } | null | undefined): T[] | null {
    if (!response) return null;
    if (Array.isArray(response)) return response;
    return response.data ?? null;
  }
  override getPedirPresupuestos(): Observable<PedirPresupuestoInfo[] | null> {
    return this.http.get<PedirPresupuestoInfo[] | { data?: PedirPresupuestoInfo[] }>(`${this.apiUrl}/pedirPresupuestos`).pipe(
      map((response): PedirPresupuestoInfo[] | null => this.unwrapArray(response)),
      catchError((error: Error) => {
        console.error("Error en getPedirPresupuesto:", error);
        return throwError(() => error);
      })
    )
  }

  override getPedirPresupuesto(idPresupuesto: string): Observable<PedirPresupuestoInfo | null> {
    return this.http.get<PedirPresupuestoInfo | { data?: PedirPresupuestoInfo }>(`${this.apiUrl}/pedirPresupuestos/${idPresupuesto}`).pipe(
      map((response): PedirPresupuestoInfo | null => this.unwrapData(response)),
      catchError((error: Error) => {
        console.error("Error en getPedirPresupuesto:", error);
        return throwError(() => error);
      })
    )
  }


  override storePedirPresupuesto(pedirPresupuesto: PedirPresupuestoStore): Observable<PedirPresupuestoStore | null> {
    const data = {
      'nombre': pedirPresupuesto.nombre,
      'telefono': pedirPresupuesto.telefono,
      'user_id': pedirPresupuesto.user_id,
      'empresa_id': pedirPresupuesto.empresa_id,
      'tipo_producto_id': pedirPresupuesto.tipo_producto_id,
      'boda_id': pedirPresupuesto.boda_id ,
      'email': pedirPresupuesto.email,
      'mensaje': pedirPresupuesto.mensaje,
      'fecha': pedirPresupuesto.fecha,
      'presupuesto': pedirPresupuesto.presupuesto,
      'invitados': pedirPresupuesto.invitados,
    }
    return this.http.post<PedirPresupuestoStore>(`${this.apiUrl}/pedirPresupuestos`, data).pipe(
      map(reponse => {
        if (reponse)
          return reponse;
        return null
      }),
      catchError((error: Error) => {
        console.error("Error en storePedirPresupuesto:", error);
        return throwError(() => error);
      })
    )
  }

  override getEmpresaPedirPresupuesto(idEmpresa: string): Observable<PedirPresupuestoInfo[] | null> {
    return this.http.get<PedirPresupuestoInfo[] | { data?: PedirPresupuestoInfo[] }>(`${this.apiUrl}/pedirPresupuestos/empresas/${idEmpresa}`).pipe(
     map((response): PedirPresupuestoInfo[] | null => this.unwrapArray(response)),
      catchError((error: Error) => {
        console.error("Error en getPedirPresupuesto:", error);
        return throwError(() => error);
      })
    )
  }

  override aceptarPresupuesto(idPresupuesto: string | number): Observable<AceptarPresupuestoResponse | null> {
    return this.http.patch<AceptarPresupuestoResponse | { data?: AceptarPresupuestoResponse }>(
      `${this.apiUrl}/pedirPresupuestos/${idPresupuesto}/aceptar`,
      {}
    ).pipe(
      map((response): AceptarPresupuestoResponse | null => this.unwrapData(response)),
      catchError((error: Error) => {
        console.error("Error en aceptarPresupuesto:", error);
        return throwError(() => error);
      })
    );
  }

  override responderPresupuesto(idPresupuesto: string | number, payload: ResponderPresupuestoPayload): Observable<PedirPresupuestoInfo | null> {
    return this.http.patch<PedirPresupuestoInfo | { data?: PedirPresupuestoInfo }>(
      `${this.apiUrl}/pedirPresupuestos/${idPresupuesto}/respuesta`,
      payload
    ).pipe(
      map((response): PedirPresupuestoInfo | null => this.unwrapData(response)),
      catchError((error: Error) => {
        console.error("Error en responderPresupuesto:", error);
        return throwError(() => error);
      })
    );
  }

  override rechazarPresupuesto(id: string | number): Observable<any> {
  return this.http.patch(`${this.apiUrl}/pedirPresupuestos/${id}/rechazar`, {}).pipe(
    catchError((error: Error) => {
      console.error("Error en rechazarPresupuesto:", error);
      return throwError(() => error);
    })
  );
}


}
