export interface Tarea {
  id: number;
  boda_id: number;
  titulo: string;
  descripcion: string | null;
  fecha_limite: string | null;
  completada: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTarea {
  boda_id: number;
  titulo: string;
  descripcion?: string | null;
  fecha_limite?: string | null;
}

export interface UpdateTarea {
  titulo?: string;
  descripcion?: string | null;
  fecha_limite?: string | null;
  completada?: boolean;
}
