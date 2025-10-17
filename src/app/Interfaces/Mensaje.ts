import { UsuarioLigero } from './User';

export interface Mensaje {
    emisor: UsuarioLigero;
    receptor: UsuarioLigero;
    contenido: string;
    archivo: string | null;
    leido: boolean | number; 
}

export interface Mensajes {
    data: Mensaje[]
}

export interface CreateMensaje {
    emisor_id: string, 
    receptor_id: string, 
    contenido: string
}