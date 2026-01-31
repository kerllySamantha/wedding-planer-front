import { Injectable } from '@angular/core';
import { CreateEmpresa, Empresa, EmpresaResponse, Empresas } from '../../Interfaces/Empresa';
import { Observable } from 'rxjs';
import { CreateUser } from '../../Interfaces/User';

@Injectable({
  providedIn: 'root'
})
export abstract class EmpresasServiceServiceService {

  constructor() { }

  abstract getEmpresas(): Observable<Empresas | null>;
  abstract getEmpresa(idUsuario: bigint): Observable<Empresa | null>;
  abstract postEmpresa(usuario: CreateEmpresa): Observable<CreateEmpresa | null>;
  abstract editEmpresa(idUsuario: string | null, usuario: CreateUser): Observable<Object | null>;
  abstract deleteEmpresa(idUsuario: bigint): Observable<Object | null>;
   abstract getEmpresaByUser(idUsuario: number): Observable<EmpresaResponse | null>;

}
