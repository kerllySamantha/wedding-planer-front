import { PedirPresupuestoInfo } from "./PedirPresupuesto";
export interface Notificacion {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  leido: boolean;
  referencia_id?: number | string | null;
  referencia_type?: string | null;
  referencia?: PedirPresupuestoInfo | null;
}


export interface NotificacionResponse {
  data: Notificacion;
}
