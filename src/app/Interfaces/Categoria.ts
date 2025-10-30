import { TipoSimple } from "./Tipos"

export interface Categoria{
    id: number, 
    nombre: string,
    icono?: string,
    slug?: string
    descripcion?: string
}



export interface CategoriaSimple{
    id: number,
    nombre: string
}

export interface InfoCategoria extends Categoria{
    tipos: TipoSimple[]
}

export interface CategoriaIndividual{
    data : InfoCategoria[]
}

export interface Categorias  {
    data: InfoCategoria[]
}