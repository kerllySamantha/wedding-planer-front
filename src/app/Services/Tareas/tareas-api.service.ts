import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../Tokens/serviceTokens';
import { CreateTarea, Tarea, UpdateTarea } from '../../Interfaces/Tarea';

@Injectable({
  providedIn: 'root',
})
export class TareasApiService {
  private http   = inject(HttpClient);
  private apiUrl = inject(API_URL);

  getByBoda(bodaId: number): Observable<Tarea[]> {
    return this.http.get<Tarea[]>(`${this.apiUrl}/tareas/boda/${bodaId}`);
  }

  create(tarea: CreateTarea): Observable<Tarea> {
    return this.http.post<Tarea>(`${this.apiUrl}/tareas`, tarea);
  }

  update(id: number, tarea: UpdateTarea): Observable<Tarea> {
    return this.http.put<Tarea>(`${this.apiUrl}/tareas/${id}`, tarea);
  }

  toggle(id: number): Observable<Tarea> {
    return this.http.patch<Tarea>(`${this.apiUrl}/tareas/${id}/toggle`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tareas/${id}`);
  }
}
