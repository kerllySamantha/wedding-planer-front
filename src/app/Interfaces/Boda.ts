    import { Poblacion, Provincia } from "./CIudades";

export interface ReservaBoda {
    id: number;
    empresa_id: number;
    estado: string;
    empresa?: {
        id: number;
        nombre_empresa: string;
    } | null;
}

    import { Presupuesto } from "./Presupuesto";
    import { Foto, Resenia } from "./Resenia";
    import { User } from "./User";

export interface Boda {
        id: number
        nombre_pareja: string,
        fecha_boda: Date,
        ubicacion: string,
        usuario: User,
        // presupuesto_total: number,
        notas: string
        fotos: Foto[],
        poblacion: Poblacion,
        provincia: Provincia
        presupuestos: Presupuesto[],
        proveedores?: unknown[],
        reservas?: ReservaBoda[],
        resumen_presupuesto?: unknown,
        planificacion?: {
            presupuestos?: Presupuesto[] | null,
            resumen_presupuesto?: unknown,
            proveedores?: unknown[] | null,
        } | null,
        resultado_evento?: {
            fotos?: Array<Foto | string> | null,
        } | null,
        resenias?: Resenia[] | null,
        
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
        fecha_boda: Date | string,
        ubicacion: string,
        notas?: string,
        poblacion_id?: number,
        fotos?: Array<{ url: string; path?: string }>,
    }



    // export interface BodaLigeraReserva {
    //     id: number, 
    //     nombre_pareja: string,
    //     fecha_boda: Date,
    //     ubicacion: string,
    // }
