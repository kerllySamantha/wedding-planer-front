import { Injectable } from '@angular/core';
import { Categoria, CategoriaIndividual, Categorias, InfoCategoria } from '../../Interfaces/Categoria';
import { Observable } from 'rxjs';
import { TipoCategoria, TipoSimple } from '../../Interfaces/Tipos';

@Injectable({
    providedIn: 'root'
})
export abstract class CategoriasServiceService {
    constructor() { }
    abstract getCategorias(): Observable<Categorias | null>;
    abstract postCategoria(Categoria: Categoria): Observable<Object | null>;
    abstract getCategoria(idCategoria: CategoriaIndividual): Observable<CategoriaIndividual | null>
    abstract getCategoriaTipo(idCategoria: number): Observable<TipoCategoria | null>;
}