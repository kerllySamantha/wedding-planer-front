export interface PedirPresupuestoStore {
    nombre: string,
    telefono: string,
    user_id: number,
    empresa_id: number,
    boda_id?: number,
    invitados: number,
    presupuesto: number
    email: string,
    mensaje: string,
    fecha?: string,
}

export interface PedirPresupuestoInfo {
    nombre: string,
    telefono: string,
    user_id: number,
    id?: string
    empresa_id: number,
    boda_id?: number,
    email: string,
    invitados: number,
    presupuesto: number
    mensaje: string,
    fecha?: string,
    fecha_respuesta: Date | string,
    comentario_empresa: string,
    importe_ofertado: number,
    estado: EstadoPedirPresupuesto
}

export interface EstadoPedirPresupuesto {
    rechazado_empresa: string,
    aceptado_empresa: string,
    pendiente: string
}
