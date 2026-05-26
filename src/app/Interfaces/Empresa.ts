import { CreateUser, User } from './User';
import { Categoria } from './Categoria';
import { Foto } from './Resenia';
import { Poblacion, Provincia } from './CIudades';
import { Servicio } from './Servicio';
import {  ProductoEmpresa } from './Producto';

export interface EmpresaLigera {
  id: number;
  nombre: string;
}

export interface EmpresaBase {
  id?: number;
  nombre_empresa: string;
  direccion: string;
  telefono: string;
  descripcion?: string;
  logo?: string;
  fotos?: Foto[] | null;
  poblacion: Poblacion,
  provincia: Provincia,
  tipo_servicio: string
  // servicios: Servicio[]
}

export interface Empresas {
  data: Empresa[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  next_page_url: string | null
  prev_page_url: string | null
}

export interface EmpresaResponse{
  data: Empresa
}



export interface Empresa extends EmpresaBase {
  usuario: User;
  productos: ProductoEmpresa[];
  // categoria: Categoria;
}



export interface EstadisticasEmpresa {
  status: string;
  data: {
    reservasPorEstado:        { estado: string;   total: number }[];
    reservasPorMes:           { mes: string;      total: number }[];
    topProductos:             { nombre: string;   total: number }[];
    distribucionValoraciones: { estrella: number; total: number }[];
    mediaValoracion:          number;
    totalReservas:            number;
    totalResenias:            number;
    totalProductos:           number;
  };
}

export interface CreateEmpresa  {
 
  nombre_empresa: string,
  tipo_servicio: string,
  email: string,
  telefono: string,
  name: string,
  password: string,
  poblacion_id : number,
  direccion: string,
  descripcion?: string,
  logo?: string,
  fotos?: Foto[],
  productos?: {
    id: number | null,
    nombre: string,
    descripcion?: string,
    precio_max?: number,
    precio_min?: number,
    tipo_producto_id?: number,
    tipo_producto_nombre?: string,
    categoria_nombre?: string
  }[]
  productos_eliminados?: number[]

}


