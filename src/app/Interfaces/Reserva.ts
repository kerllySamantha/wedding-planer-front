import { BodaLigera } from "./Boda";
import { UsuarioLigero } from "./User";

export interface Reserva {
    usuario: UsuarioLigero,
    fecha: string, 
    estado: EstadoReserva, 
    boda: BodaLigera,
    presupuesto: number,
    notas: string
}

export type EstadoReserva = 'pendiente' | 'confirmada' | 'cancelada';



export interface Reservas {
    data: Reserva[];
    links: Links;
    meta: Meta;
}



export interface Links {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
}

export interface Meta {
    current_page: number;
    from: number;
    last_page: number;
    links: MetaLink[];
    path: string;
    per_page: number;
    to: number;
    total: number;
}

export interface MetaLink {
    url: string | null;
    label: string;
    page: number | null;
    active: boolean;
}

export interface CreateReserva {
    user_id: number;      
    empresa_id: number;   
    fecha: string;       
    estado: 'pendiente' | 'confirmada' | 'cancelada';
}
