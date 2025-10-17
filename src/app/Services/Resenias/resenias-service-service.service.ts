import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateResenia, Resenia, Resenias } from '../../Interfaces/Resenia';
import { Bodas } from '../../Interfaces/Boda';

@Injectable({
  providedIn: 'root'
})
export abstract class ReseniasServiceServiceService  {

  constructor() { }

    abstract getResenias(): Observable<Resenias| null>;
    abstract getResenia(idResenia: bigint): Observable<Resenia| null>;
    abstract postResenia(usuario: CreateResenia): Observable<CreateResenia | null>;
    abstract editarResenia(idResenia: string | null, usuario: CreateResenia): Observable<Object | null>;
    abstract deleteResenia(idResenia: bigint): Observable<Object | null>;
}
