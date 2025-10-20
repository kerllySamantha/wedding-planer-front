export interface Poblacion {
    nombre: string;
    id: number;
}

export interface Provincia {
    nombre: string;
    id: number;
}

export interface Provincias {
    data: [
        Provincia[]
    ]
}

export interface Town {
    id: number;
    nombre: string;
    provincia_id: number;
    nombre_provincia: string;

}

export interface Poblaciones {
    data: [
        Town[]
    ]
}

export interface PoblacionesProvincias {
    data: Poblacion[]
}
