import { Poblacion, Provincia } from "./CIudades";
import { Foto } from "./Resenia";
import { User } from "./User";

export interface Boda {
    id: number
    nombre_pareja: string,
    fecha_boda: Date,
    ubicacion: string,
    usuario: User,
    presupuesto: number,
    notas: string
    fotos: Foto[],
    poblacion: Poblacion,
    provincia: Provincia
}

export interface InfoBoda{
    data: Boda
}


export interface BodaLigera {
    id: number,
    nombre_pareja: string,
    fecha_boda: Date,
    ubicacion: string,
}

export interface Bodas {
    data: Boda[];
}

export interface CreateBoda {
    nombre_pareja: string,
    fecha_boda: Date, 
    ubicacion: string
}



// export interface BodaLigeraReserva {
//     id: number, 
//     nombre_pareja: string,
//     fecha_boda: Date,
//     ubicacion: string,
// }