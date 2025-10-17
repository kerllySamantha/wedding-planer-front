import { Inject, Injectable } from '@angular/core';
import { CategoriasServiceService } from './categoria-service.service';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../Tokens/serviceTokens';
import { Categoria, Categorias } from '../../Interfaces/Categoria';
import { Observable } from 'rxjs';

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

  override postCategoria(categoria: Categoria): Observable<Object | null> {
    return this.http.post(`${this.apiUrl}/categorias`, categoria);
  }
}