import { CreateUser, User } from './User';

export interface Perfil {
    id: number,
    telefono : string,
    direccion: string,
    usuario: User,
    poblacion: { id: number, nombre: string },
    provincia: { id: number, nombre: string },
}



export interface Perfiles {
    data: Perfil[]
}

export interface PerfilResponse {
    status: string,
    message: string,
    data: Perfil
}

export interface CreatePerfilUsuario extends CreateUser {
    direccion: string;
    telefono: string;
    poblacion_id: number,
    fecha_boda: string
}
