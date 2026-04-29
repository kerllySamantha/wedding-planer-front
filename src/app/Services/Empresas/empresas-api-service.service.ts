import { Inject, Injectable } from '@angular/core';
import { EmpresasServiceServiceService } from './empresas-service-service.service';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../Tokens/serviceTokens';
import { CreateEmpresa, Empresa, EmpresaResponse, Empresas } from '../../Interfaces/Empresa';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { Productos } from '../../Interfaces/Producto';

@Injectable({
  providedIn: 'root'
})
export class EmpresasApiServiceService  extends EmpresasServiceServiceService{

  constructor(protected http: HttpClient, @Inject(API_URL) public apiUrl: string) {
    super();
  }

  override getEmpresas(): Observable<Empresas | null> {
    return this.http.get<Empresas>(`${this.apiUrl}/empresas`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      })
    );
  }

  override getEmpresa(idEmpresa: bigint): Observable<Empresa | null> {
    console.log("idEmpresa: " + idEmpresa);

    return this.http.get<Empresa>(`${this.apiUrl}/empresas/${idEmpresa.toString()}`).pipe(
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
    productos: empresa.productos ?? []
  };

  return this.http.post<Empresa>(`${this.apiUrl}/empresas`, postObject).pipe(
    tap((response) => console.log(response))
  );
}



  override editEmpresa(idEmpresa : string, empresa: CreateEmpresa): Observable<Object| null> {
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
      productos: empresa.productos ?? []
    }
    return this.http.put(`${this.apiUrl}/empresas/${idEmpresa}`, putObject)
  }

  override deleteEmpresa(idEmpresa: bigint): Observable<Object | null> {
    return this.http.delete(`${this.apiUrl}/empresas/${idEmpresa.toString()}`);
  }


    override getEmpresaByUser(idUser: number): Observable<EmpresaResponse | null> {
    console.log("idUsuario: " + idUser);

    return this.http.get<EmpresaResponse>(`${this.apiUrl}/empresa/usuario/${idUser.toString()}`).pipe(
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

  override getEmpresaProductos(idEmpresa: number): Observable<Productos | null> {
    
    return this.http.get<Productos>(`${this.apiUrl}/empresas/${idEmpresa.toString()}/productos`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      }),
      catchError((error: Error) => {
        console.error("Error en getProductos:", error);
        return throwError(() => error);
      })
    );
  }

  uploadImageBase64(imageBase64: string): Observable<{ data?: { url?: string }; url?: string } | null> {
    return this.http.post<{ data?: { url?: string }; url?: string }>(
      `${this.apiUrl}/imagenes/base64`,
      { image: imageBase64 }
    ).pipe(
      map(response => response || null),
      catchError((error: Error) => {
        console.error('Error al subir imagen base64:', error);
        return throwError(() => error);
      })
    );
  }
}
