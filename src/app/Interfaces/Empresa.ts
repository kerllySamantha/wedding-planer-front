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
  id: number;
  nombre_empresa: string;
  direccion: string;
  telefono: string;
  descripcion: string;
  logo?: string;
  fotos: Foto[] | null;
  poblacion: Poblacion,
  provincia: Provincia,
  tipo_servicio: string
  // servicios: Servicio[]
}

export interface Empresas {
  data: Empresa[]
}

export interface EmpresaResponse{
  data: Empresa
}



export interface Empresa extends EmpresaBase {
  usuario: User;
  productos: ProductoEmpresa[];
  // categoria: Categoria;
}



export interface CreateEmpresa extends EmpresaBase {
  // categoria_id: number;
  name: string;
  email: string;
  password: string;
  rol: string;
}

