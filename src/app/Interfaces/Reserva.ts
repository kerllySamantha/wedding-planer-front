import { Boda, BodaLigera } from "./Boda";
import { Producto, ProductoCalendario } from "./Producto";
import { UsuarioLigero, Usuarios } from "./User";

export interface Reserva {
    usuario: UsuarioLigero,
    fecha_inicio: string,
    fecha_fin: string,
    estado: EstadoReserva,
    boda: BodaLigera,
    presupuesto: number,
    notas: string
    producto: ProductoCalendario
}

export type EstadoReserva = 'pendiente' | 'confirmada' | 'cancelada' | 'bloqueada';



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
    fecha_inicio: string;
    fecha_fin: string,
    origen: string
    estado: 'pendiente' | 'bloqueada' | 'confirmada' | 'cancelada';
    notas: string
    boda_id?: number
}

export interface ReservaEvent {
    id?: string;
    title: string;
    start: string;
    end: string;
    singleDay?:  boolean
    backgroundColor?: string;
    borderColor?: string;
    extendedProps: ExtendedReservaProps;
    allDay?: boolean
}

export interface ExtendedReservaProps {
    estado: 'bloqueada' | 'confirmada' | 'cancelada' | 'pendiente';
    origen?: string;
    notas?: string;
    cliente?: UsuarioLigero;
    empresa?: {
        id: number;
        nombre_empresa: string;
    };
    boda?: Boda;
    producto?:  ProductoCalendario
    modalidad?: 'producto' | 'servicio' | 'dia';
    fechaFin?: string;

}

export interface CalendarSelection {
    start: Date;
    end: Date;
    allDay: boolean;
    startStr: string;
    endStr: string;
    singleDay?: boolean
}

export interface SaveReservaPayload {
    form: ReservaFormValue;
    id?: string;
}


export interface ReservaFormValue {
    id?: string;
    titulo: string;
    fecha: FechaReserva;
    estado: EstadoReserva;
    notas?: string;
    modalidad?: 'producto' | 'servicio';
}

export interface FechaReserva {
    start: string;
    end: string;
    
    startStr?: string;
    endStr?: string;
    allDay: boolean;
}




