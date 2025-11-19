import { Injectable } from '@angular/core';
import { CreatePerfilUsuario, Perfil, Perfiles, PerfilResponse } from '../../Interfaces/Perfil';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export abstract class PerfilServiceServiceService {

  constructor() { }
  abstract getPerfiles(): Observable<Perfiles | null>;
  abstract getPerfil(idUsuario: bigint): Observable<PerfilResponse | null>;
  abstract postPerfil(usuario: CreatePerfilUsuario): Observable<CreatePerfilUsuario | null>;
  abstract editarPerfil(idUsuario: string | null, usuario: CreatePerfilUsuario): Observable<Object | null>;
  abstract deletePresupuesto(idUsuario: bigint): Observable<Object | null>;
  abstract getPerfilByUserId(usuarioId: number): Observable<PerfilResponse | null>
}

