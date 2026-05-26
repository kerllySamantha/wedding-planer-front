import { Inject, Injectable } from '@angular/core';
import { EmpresasServiceServiceService } from './empresas-service-service.service';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../Tokens/serviceTokens';
import {
  CreateEmpresa,
  Empresa,
  EmpresaResponse,
  Empresas,
  EstadisticasEmpresa,
} from '../../Interfaces/Empresa';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { Productos, ProductosPorCategoria } from '../../Interfaces/Producto';
import { UploadImageResponse } from '../../Interfaces/Foto';

@Injectable({
  providedIn: 'root',
})
export class EmpresasApiServiceService extends EmpresasServiceServiceService {
  constructor(
    protected http: HttpClient,
    @Inject(API_URL) public apiUrl: string,
  ) {
    super();
  }

  override getEmpresas(page: number = 1): Observable<Empresas | null> {
    return this.http.get<Empresas>(`${this.apiUrl}/empresas?page=${page}`).pipe(
      map((response) => response ?? null),
    );
  }

  override getEmpresa(idEmpresa: bigint): Observable<Empresa | null> {
    console.log('idEmpresa: ' + idEmpresa);

    return this.http
      .get<Empresa>(`${this.apiUrl}/empresas/${idEmpresa.toString()}`)
      .pipe(
        map((response) => {
          if (response) {
            return response;
          }
          return null;
        }),
        catchError((error: Error) => {
          console.error('Error en geEmpresa:', error);
          return throwError(() => error);
        }),
      );
  }

  override postEmpresa(empresa: CreateEmpresa): Observable<Empresa | null> {
    const postObject = {
      name: empresa.name,
      email: empresa.email,
      password: empresa.password,
      rol: 'empresa',
      direccion: empresa.direccion,
      telefono: empresa.telefono,
      descripcion: empresa.descripcion ?? '',
      nombre_empresa: empresa.nombre_empresa,
      tipo_servicio: empresa.tipo_servicio,
      poblacion_id: empresa.poblacion_id,
      logo: empresa.logo ?? '',
      fotos: empresa.fotos ?? [],
      productos: empresa.productos ?? [],
      productos_eliminados: empresa.productos_eliminados ?? [],
    };

    return this.http
      .post<Empresa>(`${this.apiUrl}/empresas`, postObject)
      .pipe(tap((response) => console.log(response)));
  }

  override editEmpresa(
    idEmpresa: string,
    empresa: CreateEmpresa,
  ): Observable<Object | null> {
    const putObject = {
      name: empresa.name,
      email: empresa.email,
      password: empresa.password,
      rol: 'empresa',
      direccion: empresa.direccion,
      telefono: empresa.telefono,
      descripcion: empresa.descripcion ?? '',
      nombre_empresa: empresa.nombre_empresa,
      tipo_servicio: empresa.tipo_servicio,
      poblacion_id: empresa.poblacion_id,
      logo: empresa.logo ?? '',
      fotos: empresa.fotos ?? [],
      productos: empresa.productos ?? [],
      productos_eliminados: empresa.productos_eliminados ?? [],
    };
    return this.http.put(`${this.apiUrl}/empresas/${idEmpresa}`, putObject);
  }

  override deleteEmpresa(idEmpresa: bigint): Observable<Object | null> {
    return this.http.delete(`${this.apiUrl}/empresas/${idEmpresa.toString()}`);
  }

  override getEmpresaByUser(
    idUser: number,
  ): Observable<EmpresaResponse | null> {
    console.log('idUsuario: ' + idUser);

    return this.http
      .get<EmpresaResponse>(
        `${this.apiUrl}/empresa/usuario/${idUser.toString()}`,
      )
      .pipe(
        map((response) => {
          if (response) {
            return response;
          }
          return null;
        }),
        catchError((error: Error) => {
          console.error('Error en geEmpresa:', error);
          return throwError(() => error);
        }),
      );
  }

  override getEmpresaProductos(
    idEmpresa: number,
  ): Observable<Productos | ProductosPorCategoria | null> {
    return this.http
      .get<ProductosPorCategoria>(
        `${this.apiUrl}/empresas/${idEmpresa.toString()}/productos`,
      )
      .pipe(
        map((response) => {
          if (response) {
            return response;
          }
          return null;
        }),
        catchError((error: Error) => {
          console.error('Error en getProductos:', error);
          return throwError(() => error);
        }),
      );
  }

  getEstadisticasEmpresa(id: number): Observable<EstadisticasEmpresa> {
    return this.http.get<EstadisticasEmpresa>(`${this.apiUrl}/empresa/${id}/estadisticas`);
  }

  uploadImageBase64(
    imageBase64: string,
    extension: string,
    userId: number,
  ): Observable<UploadImageResponse> {
    return this.http
      .post<UploadImageResponse>(`${this.apiUrl}/imagenes`, {
        imagen: imageBase64,
        extension,
        user_id: userId,
      })
      .pipe(
        tap((response) => console.log(response.path, response.url)),
        catchError((error: Error) => {
          console.error('Error al subir imagen base64:', error);
          return throwError(() => error);
        }),
      );
  }
}
