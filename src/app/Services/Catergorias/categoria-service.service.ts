import { Injectable } from '@angular/core';
import { Categoria, Categorias } from '../../Interfaces/Categoria';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export abstract class CategoriasServiceService {
    constructor() { }
    abstract getCategorias(): Observable<Categorias | null>;
    abstract postCategoria(Categoria: Categoria): Observable<Object | null>;
}