import { Inject, Injectable } from '@angular/core';
import { CategoriasServiceService } from './categoria-service.service';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../Tokens/serviceTokens';
import { Categoria, CategoriaIndividual, Categorias, InfoCategoria } from '../../Interfaces/Categoria';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoriasApiServiceService extends CategoriasServiceService {

  constructor(protected http: HttpClient, @Inject(API_URL) public apiUrl: string) {
    super();
  }

  override getCategorias(): Observable<Categorias | null> {
    return this.http.get<Categorias>(`${this.apiUrl}/categorias`);
  }

  override getCategoria(idCategoria: CategoriaIndividual): Observable<CategoriaIndividual | null> {
    return this.http.get<CategoriaIndividual>(`${this.apiUrl}/categorias/${idCategoria.toString()}`).pipe(
      map(response => {
        if (response) {
          return response;
        }
        return null;
      }),
      catchError((error: Error) => {
        console.error("Error en getPerfil:", error);
        return throwError(() => error);
      })
    );
  }

  override postCategoria(categoria: Categoria): Observable<Object | null> {
    return this.http.post(`${this.apiUrl}/categorias`, categoria);
  }
}