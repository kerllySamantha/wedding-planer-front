import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateUser, UserResponse, Usuarios } from '../../Interfaces/User';

@Injectable({
  providedIn: 'root'
})
export abstract class UsuariosServiceService {
  constructor() { }
  abstract getUsuarios(): Observable<Usuarios|null>;
  abstract getUsuario(idUsuario: bigint): Observable<UserResponse|null>;
  abstract postUsuario(usuario: CreateUser): Observable<UserResponse|null>;
  abstract putUsuarioEditar(idUsuario: string|null, usuario: CreateUser): Observable<Object|null>;
  abstract deleteUsuario(idUsuario: bigint): Observable<Object|null>;
}
