import { Injectable } from '@angular/core';
import { Boda, Bodas, CreateBoda, InfoBoda } from '../../Interfaces/Boda';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export abstract class BodaServiceServiceService {

  constructor() { }

  abstract getBodas(): Observable<Bodas | null>;
  abstract getBoda(idUsuario: bigint): Observable<Boda | null>;
  abstract postBoda(usuario: CreateBoda): Observable<CreateBoda | null>;
  abstract editarBoda(idUsuario: string | null, usuario: CreateBoda): Observable<Object | null>;
  abstract deleteBoda(idUsuario: bigint): Observable<Object | null>;
  abstract getBodaByUserId(usuarioId: number): Observable<InfoBoda | null>
}
