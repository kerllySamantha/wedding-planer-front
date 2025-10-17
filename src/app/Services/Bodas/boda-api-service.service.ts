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

  constructor(protected http: HttpClient, @Inject(API_URL) public apiUrl: string) {
    super();
  }

  override getBodas(): Observable<Bodas | null> {
    return this.http.get<Bodas>(`${this.apiUrl}/bodas`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      })
    );
  }

  override getBoda(idBoda: bigint): Observable <Boda|  null> {
    console.log("idUsuario: " + idBoda);

    return this.http.get<Boda>(`${this.apiUrl}/empresas/${idBoda.toString()}`).pipe(
      map(response => {
        if (response) {
          return response;
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
      name: boda.fecha_boda,
      email: boda.nombre_pareja,
      password: boda.ubicacion,
    
    }
    return this.http.post<Boda>(`${this.apiUrl}/empresas`, postObject);
  }



  override editarBoda(idBoda : string, boda: CreateBoda): Observable<Object| null> {
    const putObject = {
      name: boda.fecha_boda,
      email: boda.nombre_pareja,
      password: boda.ubicacion,
    }
    return this.http.put(`${this.apiUrl}/bodas/${idBoda}`, putObject)
  }

  override deleteBoda(idBoda: bigint): Observable<Object | null> {
    return this.http.delete(`${this.apiUrl}/bodas/${idBoda.toString()}`);
  }

  override getBodaByUserId(usuarioId: number) {
    return this.http.get<InfoBoda>(`${this.apiUrl}/bodas/usuario/${usuarioId}`).pipe(
      map(response => {
        if (response) {
          return response;
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
