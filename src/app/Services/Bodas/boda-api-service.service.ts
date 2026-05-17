import { Inject, Injectable } from '@angular/core';
import { Boda, Bodas, CreateBoda, InfoBoda } from '../../Interfaces/Boda';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../Tokens/serviceTokens';
import { catchError, map, Observable, throwError } from 'rxjs';
import { BodaServiceServiceService } from './boda-service-service.service';

@Injectable({
  providedIn: 'root'
})
export class BodaApiServiceService extends BodaServiceServiceService{

  private normalizarFotos(fotos: Array<{ path?: string | null; url?: string | null } | string> | null | undefined) {
    return (fotos ?? []).map((foto) => {
      if (typeof foto === 'string') {
        const value = foto.trim();
        return { path: value, url: value };
      }
      const path = (foto?.path ?? '').trim();
      const url = (foto?.url ?? '').trim();
      return { path: path || url, url: url || path };
    }).filter((foto) => !!foto.path || !!foto.url);
  }

  private normalizarBoda(boda: Boda): Boda {
    const presupuestos = boda.planificacion?.presupuestos ?? boda.presupuestos ?? [];
    const resumen = boda.planificacion?.resumen_presupuesto ?? boda.resumen_presupuesto;
    const proveedores = boda.planificacion?.proveedores ?? boda.proveedores ?? [];
    const fotos = this.normalizarFotos(boda.resultado_evento?.fotos ?? boda.fotos ?? []);

    return {
      ...boda,
      presupuestos,
      resumen_presupuesto: resumen,
      proveedores,
      fotos,
      planificacion: {
        ...(boda.planificacion ?? {}),
        presupuestos,
        resumen_presupuesto: resumen,
        proveedores,
      },
      resultado_evento: {
        ...(boda.resultado_evento ?? {}),
        fotos,
      },
    };
  }

  constructor(protected http: HttpClient, @Inject(API_URL) public apiUrl: string) {
    super();
  }

  override getBodas(): Observable<Bodas | null> {
    return this.http.get<Bodas>(`${this.apiUrl}/bodas`).pipe(
      map(response => {
        if (response) {
          return {
            ...response,
            data: (response.data ?? []).map((boda) => this.normalizarBoda(boda)),
          };
        }
        return null;
      })
    );
  }

  override getBoda(idBoda: bigint): Observable <Boda|  null> {
    console.log("idUsuario: " + idBoda);

    return this.http.get<Boda>(`${this.apiUrl}/bodas/${idBoda.toString()}`).pipe(
      map(response => {
        if (response) {
          return this.normalizarBoda(response);
        }
        return null;
      }),
      catchError((error: Error) => {
        console.error("Error en geEmpresa:", error);
        return throwError(() => error);
      })
    );
  }

  override postBoda(boda:CreateBoda): Observable<CreateBoda| null> {
    const postObject = {
      nombre_pareja: boda.nombre_pareja,
      fecha_boda: boda.fecha_boda,
      ubicacion: boda.ubicacion,
      notas: boda.notas ?? '',
      poblacion_id: boda.poblacion_id ?? null,
    };

    return this.http.post<CreateBoda>(`${this.apiUrl}/bodas`, postObject);
  }



  override editarBoda(idBoda : string, boda: CreateBoda): Observable<Object| null> {
    const putObject = {
      nombre_pareja: boda.nombre_pareja,
      fecha_boda: boda.fecha_boda,
      ubicacion: boda.ubicacion,
      notas: boda.notas ?? '',
      poblacion_id: boda.poblacion_id ?? null,
    };
    return this.http.put(`${this.apiUrl}/bodas/${idBoda}`, putObject)
  }

  override deleteBoda(idBoda: bigint): Observable<Object | null> {
    return this.http.delete(`${this.apiUrl}/bodas/${idBoda.toString()}`);
  }

  override getBodaByUserId(usuarioId: number) {
    return this.http.get<InfoBoda>(`${this.apiUrl}/bodas/usuario/${usuarioId}`).pipe(
      map(response => {
        if (response) {
          return {
            ...response,
            data: this.normalizarBoda(response.data),
          };
        }
        return null;
      }),
      catchError((error: Error) => {
        console.error("Error en boda:", error);
        return throwError(() => error);
      })
    
    );
  }
}
