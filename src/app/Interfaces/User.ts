export interface User {
    id: number,
    email: string,
    name: string,
    rol: string
}

export interface UsuarioLigero {
    id: number;
    name: string;
    rol?: string;
}

export interface Usuarios{
    data: User[]
}

export interface CreateUser {
    id?: number,
    name: string,
    rol?: string,
    email: string
    password: string

}

export interface UserResponse{
    message: string, 
    status: string, 
    data: User
}