import { EmpresaLigera } from "./Empresa";
import { TipoSimple } from "./Tipos";
import { CategoriaSimple } from "./Categoria";

export interface ProductoBase {
  id: number;
  nombre: string;
  descripcion: string;
  precio_max: number;
  precio_min: number;
}

export interface ProductoSimple {
  id: number;
  nombre: string;
}

export interface Producto extends ProductoBase {
  empresa: EmpresaLigera;
  tipo_producto: TipoSimple;
}

export interface ProductoEmpresa extends ProductoBase {
  tipo_producto: TipoSimple;
  categoria: CategoriaSimple;
}

export interface Productos {
  data: Producto[];
}

export interface ProductosPorCategoria {
  data: ProductoEmpresa[];
}

export type ProductoCalendario = Producto;