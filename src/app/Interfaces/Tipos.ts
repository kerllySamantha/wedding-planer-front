import { CategoriaSimple } from "./Categoria";

export interface TipoBase{
    id: number,
    nombre: string,
    description: Text,
}

export interface TipoData extends TipoBase{
    categoria: CategoriaSimple 
}

export interface TipoSimple {
    id: number,
    nombre: string,
    modalidad: 'producto'| 'servicio';
}

export interface Tipos{
    data: TipoData[]
}

export interface TipoCategoria{
    data: TipoSimple[];
}

export interface CreateTipo extends TipoBase{
    
}