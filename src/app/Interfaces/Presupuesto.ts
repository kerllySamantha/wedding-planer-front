import { Categoria, CategoriaSimple } from "./Categoria";
import { ProductoBase, ProductoSimple } from "./Producto";
import { TipoSimple } from "./Tipos";

export interface Presupuesto {
    id: number;
    boda_id: number;
    nombre?: string;
    descripcion?: string;
    monto_total: number;
    estado: boolean;
    fecha_creacion: string;
    items?: PresupuestoItem[];
    tipos: TipoSimple
}


export interface PresupuestoCreate {

    boda_id: number;
    monto_total: number;
    estado: boolean;
    tipo_producto_id: number,
    fecha_creacion: string;
}

export interface Presupuestos {
    data: Presupuesto[]
}

export interface PresupuestoItem {
    id?: number;
    presupuesto_id: number;
    categoria_id?: number;
    tipo_producto_id: number;
    nombre_categoria_personalizada?: string;
    nombre_tipo_personalizado?: string;
    precio_unitario: number;
    cantidad?: number;
    total_item?: number;
    es_personalizado?: boolean;
    notas?: string;
    categoria?: CategoriaSimple;
    tipo_producto?: TipoSimple;
}

export interface PresupuestoItems {
    data: PresupuestoItem[]
}

export interface ItemsDetalleCreate {
    presupuesto_id: number;
    categoria_id?: number;
    tipo_producto_id: number;
    nombre_categoria_personalizada?: string;
    nombre_tipo_personalizado?: string;
    precio_unitario: number;
    cantidad: number;
    total_item: number;
    es_personalizado?: boolean;
    notas?: string;
    categoria?: CategoriaSimple;
    tipo_producto?: TipoSimple;

}

export interface PresupuestoBoda {
    id: number;
    monto_total: number;
    estado: number;
    fecha_creacion: string;
    tipo_producto: TipoProducto;
    items_presupuesto: ItemPresupuesto[];
}
{ }
export interface PresupuestosBoda {
    status: string,
    message: string,
    data: PresupuestoBoda[]
}


export interface TipoProducto {
    id: number;
    nombre: string;
}

export interface ItemPresupuesto {
    id?: number;
    presupuesto_id?: number;
    categoria_id?: number;
    tipo_producto_id: number;
    nombre_tipo_personalizado: string;
    precio_unitario: number;
    cantidad: number;
    total_item: number;
    es_personalizado: boolean;
    notas: string;
}

// export interface Presupuesto {
//     id: number;
//     monto_total: number;
//     estado: number;
//     fecha_creacion: string;
//     tipo_producto: TipoProducto;
//     items_presupuesto: ItemPresupuesto[];
// }

// export interface PresupuestoResponse {
//     status: string;
//     message: string;
//     data: Presupuesto[];
// }


export interface SolicitudFormModel {
  fecha: Date | null;
  invitados: number | null;
  telefono: string;
  nombre: string;
  email: string;
  mensaje: string;
};