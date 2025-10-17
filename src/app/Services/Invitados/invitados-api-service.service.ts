import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { API_URL } from '../../Tokens/serviceTokens';
import { InvitadosServiceServiceService } from './invitados-service-service.service';
import { catchError, map, Observable, throwError } from 'rxjs';
import { CreateInvitado, Invitado, Invitados } from '../../Interfaces/Invitado';

@Injectable({
  providedIn: 'root'
})
export class InvitadosApiServiceService extends InvitadosServiceServiceService {


  constructor(protected http: HttpClient, @Inject(API_URL) public apiUrl: string) {
    super();
  }

  override getInvitados(): Observable<Invitados | null> {
    return this.http.get<Invitados>(`${this.apiUrl}/invitados`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      })
    );
  }
  
  override getInvitado(idInvitado: bigint): Observable<Invitado | null> {
    console.log("idInvitado: " + idInvitado);

    return this.http.get<Invitado>(`${this.apiUrl}/invitados/${idInvitado.toString()}`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      }),
      catchError((error: Error) => {
        console.error("Error en getResenia:", error);
        return throwError(() => error);
      })
    );
  }
  override postInvitado(invitado: CreateInvitado): Observable<CreateInvitado | null> {
    const postObject = {
      "boda_id": `${invitado.boda_id}`,
      "user_id": `${invitado.user_id}`

    }
    return this.http.post<CreateInvitado>(`${this.apiUrl}/invitados`, postObject);
  }
  override editarInvitado(idInvitado: string | null, invitado: CreateInvitado): Observable<Object | null> {
    const putObject = {
      "boda_id": `${invitado.boda_id}`,
      "user_id": `${invitado.user_id}`,
    }
    console.log(putObject)
    return this.http.put(`${this.apiUrl}/invitados/${idInvitado}`, putObject)
  }

  override deleteInvitado(idInvitado: bigint): Observable<Object | null> {
    return this.http.delete(`${this.apiUrl}/invitados/${idInvitado.toString()}`);

  }
}
