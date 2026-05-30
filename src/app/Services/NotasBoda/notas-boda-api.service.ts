import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../Tokens/serviceTokens';
import { CreateNotaBoda, NotaBoda, UpdateNotaBoda } from '../../Interfaces/NotaBoda';

@Injectable({
  providedIn: 'root',
})
export class NotasBodaApiService {
  private http   = inject(HttpClient);
  private apiUrl = inject(API_URL);

  getByBoda(bodaId: number): Observable<NotaBoda[]> {
    return this.http.get<NotaBoda[]>(`${this.apiUrl}/notas-boda/boda/${bodaId}`);
  }

  create(nota: CreateNotaBoda): Observable<NotaBoda> {
    return this.http.post<NotaBoda>(`${this.apiUrl}/notas-boda`, nota);
  }

  update(id: number, nota: UpdateNotaBoda): Observable<NotaBoda> {
    return this.http.put<NotaBoda>(`${this.apiUrl}/notas-boda/${id}`, nota);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/notas-boda/${id}`);
  }
}
