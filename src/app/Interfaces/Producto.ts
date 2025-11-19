import { CategoriaSimple } from "./Categoria";
import { EmpresaLigera } from "./Empresa";
import { TipoSimple } from "./Tipos";

export interface ProductoBase{
    id: number,
    nombre: string,
    descripcion: Text,
    precio_max: number,
    precio_min: number,
}

export interface ProductoSimple{
    id: number,
    nombre: string,
}

export interface ProductoEmpresa extends ProductoBase {
    tipo_producto: TipoSimple;
    categoria: CategoriaSimple
}

export interface Producto extends ProductoBase{
    empresa: EmpresaLigera
}



export interface Productos extends Producto{
    data: Producto[]
}






export interface ProductosPorCategoria {
    data: ProductoEmpresa[];
}
