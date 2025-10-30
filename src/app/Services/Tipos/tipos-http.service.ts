import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateTipo, TipoData, Tipos } from '../../Interfaces/Tipos';

@Injectable({
  providedIn: 'root'
})
export abstract class TiposHttpService {

  constructor() { }

    abstract getTipos(): Observable<Tipos | null>;
    abstract getTipo(idTipo: bigint): Observable<TipoData | null>;
    abstract postTipo(tipo: CreateTipo): Observable<CreateTipo | null>;
    abstract editartipo(idTipo: string | null, usuario: CreateTipo): Observable<Object | null>;
    abstract deleteTipo(idTipo: bigint): Observable<Object | null>;
}
