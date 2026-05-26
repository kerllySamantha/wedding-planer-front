import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { API_URL } from '../../Tokens/serviceTokens';
import { catchError, map, Observable, throwError } from 'rxjs';
import { Presupuesto, PresupuestoCreate, Presupuestos, PresupuestosBoda } from '../../Interfaces/Presupuesto';
import { PresupuestoHttpService } from './presupuesto-http-service.service';


@Injectable({
  providedIn: 'root'
})
export class PresupuestoApiService extends  PresupuestoHttpService {



  constructor(protected http: HttpClient, @Inject(API_URL) public apiUrl: string) {
    super();
  }

  override getPresupuestos(): Observable<Presupuestos | null> {
    return this.http.get<Presupuestos>(`${this.apiUrl}/presupuestos`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      })
    );
  }

  override getPresupuesto(idpresupuesto: number): Observable<Presupuesto | null> {

    return this.http.get<Presupuesto>(`${this.apiUrl}/presupuestos/${idpresupuesto.toString()}`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      }),
      catchError((error: Error) => {
        console.error("Error en getpresupuesto:", error);
        return throwError(() => error);
      })
    );
  }

  override postPresupuesto(presupuesto: PresupuestoCreate): Observable<Presupuesto| null> {
    const postObject = {
      boda_id: presupuesto.boda_id,
      monto_total: presupuesto.monto_total,
      tipo_producto_id: presupuesto.tipo_producto_id,
      estado: presupuesto.estado,
      fecha_creacion: presupuesto.fecha_creacion
    };

    return this.http.post<Presupuesto>(`${this.apiUrl}/presupuestos`, postObject);
  }



  override editarPresupuesto(idpresupuesto: number, presupuesto: PresupuestoCreate): Observable<Object | null> {
    const putObject = {
      boda_id: presupuesto.boda_id,
      // nombre: presupuesto.nombre,
      // descripcion: presupuesto.descripcion,
      monto_total: presupuesto.monto_total,
      estado: presupuesto.estado,
      fecha_creacion: presupuesto.fecha_creacion,
      tipo_producto_id: presupuesto.tipo_producto_id,
    }
    return this.http.put(`${this.apiUrl}/presupuestos/${idpresupuesto.toString()}`, putObject)
  }

  override deletePresupuesto(idPresupuesto: bigint): Observable<Object | null> {
    throw new Error('Method not implemented.');
  }

  override getPresupuestosByBoda(bodaId: number): Observable<PresupuestosBoda | null> {
    return this.http.get<PresupuestosBoda>(`${this.apiUrl}/presupuestos/boda/${bodaId}`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      }),
      catchError((error: Error) => {
        console.error("Error en getpresupuesto:", error);
        return throwError(() => error);
      })
    );
    
  }
descargarPdfBoda(bodaId: number): Observable<Blob> {
  return this.http.get(
    `${this.apiUrl}/presupuestos/boda/${bodaId}/pdf`,
    {
      responseType: 'blob'
    }
  ).pipe(
    catchError((error) => {
      console.error('Error al descargar PDF', error);
      return throwError(() => error);
    })
  );
}

  

}
