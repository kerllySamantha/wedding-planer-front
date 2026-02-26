import { UsuarioLigero } from './User';
import { EmpresaLigera, } from './Empresa';
export interface Resenia {
    id: number,
    comentario: string,
    puntuacion: string,
    usuario: UsuarioLigero,
    empresa: EmpresaLigera
    fotos?: Foto[];

}

export interface Resenias {
    data: Resenia[]
}

export interface Foto {
    path: string,
    url: string
}

export interface CreateResenia {
    user_id: string
    empresa_id: string
    puntuacion: string
    comentario: string,
    fotos: string

}

export interface ReseniasEmpresa {
    estadisticas: Estadistica,
    data: Resenia[]
}

export interface Estadistica {
    promedio: number,
    total: number,
    estrellas: Estrella[]

}

export interface Estrella {
    rating: number,
    total: number,
    porcentaje: number
}