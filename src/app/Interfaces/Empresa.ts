import { CreateUser, User } from './User';
import { Categoria } from './Categoria';
import { Foto } from './Resenia';


export interface Empresas {
  data: Empresa[]
}

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
}


export interface Empresa extends EmpresaBase {
  usuario: User;
  categoria: Categoria;
}


export interface CreateEmpresa extends EmpresaBase {
  categoria_id: number; 
  name: string;         
  email: string;
  password: string;
  rol: string;
}

