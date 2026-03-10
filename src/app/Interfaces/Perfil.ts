import { CreateUser, User } from './User';

export interface Perfil {
    id: number,
    telefono : string,
    direccion: string,
    usuario: User,
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
}
