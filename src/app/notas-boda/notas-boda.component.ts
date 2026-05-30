import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoriaNotaBoda, NotaBoda } from '../Interfaces/NotaBoda';
import { NotasBodaApiService } from '../Services/NotasBoda/notas-boda-api.service';
import { CountdownServiceService } from '../Services/countdown-service.service';

const CAT_COLORS: Record<CategoriaNotaBoda, string> = {
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
  private notasBodaApi    = inject(NotasBodaApiService);
  private countdownService = inject(CountdownServiceService);

  readonly categorias: { id: CategoriaNotaBoda; label: string; icon: string }[] = [
    { id: 'flores',     label: 'Flores',     icon: 'bi-flower1' },
    { id: 'musica',     label: 'Música',      icon: 'bi-music-note-beamed' },
    { id: 'decoracion', label: 'Decoración',  icon: 'bi-stars' },
    { id: 'catering',   label: 'Catering',    icon: 'bi-cup-hot' },
    { id: 'vestido',    label: 'Vestido',     icon: 'bi-gem' },
    { id: 'otros',      label: 'Otros',       icon: 'bi-journal-text' },
  ];

  readonly notas           = signal<NotaBoda[]>([]);
  readonly cargando        = signal(false);
  readonly mostrarForm     = signal(false);
  readonly filtroCategoria = signal<CategoriaNotaBoda | null>(null);

  nuevaTitulo    = '';
  nuevaContenido = '';
  nuevaCategoria: CategoriaNotaBoda = 'otros';

  readonly notasFiltradas = computed(() => {
    const filtro = this.filtroCategoria();
    return filtro ? this.notas().filter(n => n.categoria === filtro) : this.notas();
  });

  readonly categoriasUsadas = computed(() =>
    [...new Set(this.notas().map(n => n.categoria))],
  );

  constructor() {
    effect(() => {
      const bodaId = this.countdownService.bodaEncontrada()?.id;
      if (bodaId) this.cargarNotas(bodaId);
    });
  }

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

    const bodaId = this.countdownService.bodaEncontrada()?.id;
    if (!bodaId) return;

    this.notasBodaApi.create({
      boda_id:   bodaId,
      titulo:    this.nuevaTitulo.trim() || null,
      contenido,
      categoria: this.nuevaCategoria,
    }).subscribe({
      next: (nota) => {
        this.notas.update(list => [nota, ...list]);
        this.mostrarForm.set(false);
        this.resetForm();
      },
    });
  }

  eliminar(id: number): void {
    this.notasBodaApi.delete(id).subscribe({
      next: () => this.notas.update(list => list.filter(n => n.id !== id)),
    });
  }

  toggleFiltro(cat: CategoriaNotaBoda): void {
    this.filtroCategoria.set(this.filtroCategoria() === cat ? null : cat);
  }

  labelCategoria(id: CategoriaNotaBoda): string {
    return this.categorias.find(c => c.id === id)?.label ?? id;
  }

  iconoCategoria(id: CategoriaNotaBoda): string {
    return this.categorias.find(c => c.id === id)?.icon ?? 'bi-journal-text';
  }

  colorCategoria(id: CategoriaNotaBoda): string {
    return CAT_COLORS[id] ?? '#94a3b8';
  }

  formatearFecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  private cargarNotas(bodaId: number): void {
    this.cargando.set(true);
    this.notasBodaApi.getByBoda(bodaId).subscribe({
      next:  (notas) => { this.notas.set(notas); this.cargando.set(false); },
      error: ()      => this.cargando.set(false),
    });
  }

  private resetForm(): void {
    this.nuevaTitulo    = '';
    this.nuevaContenido = '';
    this.nuevaCategoria = 'otros';
  }
}
