import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type Categoria = 'flores' | 'musica' | 'decoracion' | 'catering' | 'vestido' | 'otros';

type NotaBoda = {
  id: string;
  titulo: string;
  contenido: string;
  categoria: Categoria;
  creadaEn: string;
};

const STORAGE_KEY = 'notas_boda';

const CAT_COLORS: Record<Categoria, string> = {
  flores:     '#f76c6f',
  musica:     '#9b7fe8',
  decoracion: '#f59e0b',
  catering:   '#22c55e',
  vestido:    '#ec4899',
  otros:      '#94a3b8',
};

@Component({
  selector: 'app-notas-boda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notas-boda.component.html',
  styleUrl: './notas-boda.component.scss',
})
export class NotasBodaComponent {

  readonly categorias: { id: Categoria; label: string; icon: string }[] = [
    { id: 'flores',     label: 'Flores',     icon: 'bi-flower1' },
    { id: 'musica',     label: 'Música',      icon: 'bi-music-note-beamed' },
    { id: 'decoracion', label: 'Decoración',  icon: 'bi-stars' },
    { id: 'catering',   label: 'Catering',    icon: 'bi-cup-hot' },
    { id: 'vestido',    label: 'Vestido',     icon: 'bi-gem' },
    { id: 'otros',      label: 'Otros',       icon: 'bi-journal-text' },
  ];

  readonly notas           = signal<NotaBoda[]>(this.cargarNotas());
  readonly mostrarForm     = signal(false);
  readonly filtroCategoria = signal<Categoria | null>(null);

  nuevaTitulo    = '';
  nuevaContenido = '';
  nuevaCategoria: Categoria = 'otros';

  readonly notasFiltradas = computed(() => {
    const filtro = this.filtroCategoria();
    return filtro ? this.notas().filter(n => n.categoria === filtro) : this.notas();
  });

  readonly categoriasUsadas = computed(() =>
    [...new Set(this.notas().map(n => n.categoria))],
  );

  abrirForm(): void {
    this.mostrarForm.set(true);
    this.resetForm();
  }

  cancelar(): void {
    this.mostrarForm.set(false);
    this.resetForm();
  }

  guardar(): void {
    const contenido = this.nuevaContenido.trim();
    if (!contenido) return;

    const nota: NotaBoda = {
      id:        Date.now().toString(36) + Math.random().toString(36).slice(2),
      titulo:    this.nuevaTitulo.trim(),
      contenido,
      categoria: this.nuevaCategoria,
      creadaEn:  new Date().toISOString(),
    };

    const lista = [nota, ...this.notas()];
    this.notas.set(lista);
    this.persistir(lista);
    this.mostrarForm.set(false);
    this.resetForm();
  }

  eliminar(id: string): void {
    const lista = this.notas().filter(n => n.id !== id);
    this.notas.set(lista);
    this.persistir(lista);
  }

  toggleFiltro(cat: Categoria): void {
    this.filtroCategoria.set(this.filtroCategoria() === cat ? null : cat);
  }

  labelCategoria(id: Categoria): string {
    return this.categorias.find(c => c.id === id)?.label ?? id;
  }

  iconoCategoria(id: Categoria): string {
    return this.categorias.find(c => c.id === id)?.icon ?? 'bi-journal-text';
  }

  colorCategoria(id: Categoria): string {
    return CAT_COLORS[id] ?? '#94a3b8';
  }

  formatearFecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  private resetForm(): void {
    this.nuevaTitulo    = '';
    this.nuevaContenido = '';
    this.nuevaCategoria = 'otros';
  }

  private cargarNotas(): NotaBoda[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as NotaBoda[]) : [];
    } catch {
      return [];
    }
  }

  private persistir(notas: NotaBoda[]): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notas)); } catch {}
  }
}
