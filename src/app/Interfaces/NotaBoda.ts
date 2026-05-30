export type CategoriaNotaBoda = 'flores' | 'musica' | 'decoracion' | 'catering' | 'vestido' | 'otros';

export interface NotaBoda {
  id: number;
  boda_id: number;
  titulo: string | null;
  contenido: string;
  categoria: CategoriaNotaBoda;
  created_at: string;
  updated_at: string;
}

export interface CreateNotaBoda {
  boda_id: number;
  titulo?: string | null;
  contenido: string;
  categoria: CategoriaNotaBoda;
}

export interface UpdateNotaBoda {
  titulo?: string | null;
  contenido?: string;
  categoria?: CategoriaNotaBoda;
}
