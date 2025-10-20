import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { Provincia, Town, Poblaciones } from '../../Interfaces/CIudades';
import { API_URL } from '../../Tokens/serviceTokens';
import { RegionsServer } from './regiones-abstract.server';

@Injectable({
  providedIn: 'root'
})
export class RegionesApiServer extends RegionsServer {
 

  constructor(private http: HttpClient,
    @Inject(API_URL) private apiUrl: string,
  ) {
    super()
  }
  getProvincias(): Observable<Provincia[]> {
    return this.http.get<{ data: Provincia[] }>(`${this.apiUrl}/provincias`).pipe(
      map(response => response.data)
    );
  }


  getTowns(id: number): Observable<Town[]> {
    return this.http.get<{ data: Town[] }>(`${this.apiUrl}/poblaciones?provincia=${id}`).pipe(
      map(response => response.data),
     
    );
  }
  

  getTotalTowns(): Observable<Poblaciones> {
    return this.http.get<any>(`${this.apiUrl}/poblaciones`).pipe(
      map(response => response.data)
    );
  }

  override getProvinciaPoblacion(id: number): Observable<Poblaciones[]> {
    return this.http.get<{ data: Poblaciones[] }>(`${this.apiUrl}/provincias/poblacion/${id}`).pipe(
      map(response => response.data)
    );
  }








}
