import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TareasApiService } from '../Services/Tareas/tareas-api.service';
import { CountdownServiceService } from '../Services/countdown-service.service';
import { Tarea } from '../Interfaces/Tarea';

@Component({
  selector: 'app-tareas-mi-boda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tareas-mi-boda.component.html',
  styleUrl: './tareas-mi-boda.component.scss',
})
export class TareasMiBodaComponent {
  private tareasApi        = inject(TareasApiService);
  private countdownService = inject(CountdownServiceService);

  tareas    = signal<Tarea[]>([]);
  cargando  = signal(false);

  readonly total       = computed(() => this.tareas().length);
  readonly completadas = computed(() => this.tareas().filter(t => t.completada).length);
  readonly progreso    = computed(() =>
    this.total() === 0 ? 0 : Math.round((this.completadas() / this.total()) * 100)
  );
  readonly pendientes  = computed(() => this.tareas().filter(t => !t.completada));
  readonly hechas      = computed(() => this.tareas().filter(t => t.completada));

  constructor() {
    effect(() => {
      const bodaId = this.countdownService.bodaEncontrada()?.id;
      if (bodaId) this.cargarTareas(bodaId);
    });
  }

  ngOnInit(): void {
    this.countdownService.cargarBodaDelUsuario();
  }

  toggle(tarea: Tarea): void {
    // Update optimista: mueve la tarea al instante
    this.tareas.update(list =>
      list.map(t => t.id === tarea.id ? { ...t, completada: !t.completada } : t)
    );

    this.tareasApi.toggle(tarea.id).subscribe({
      next: (actualizada) => {
        this.tareas.update(list =>
          list.map(t => t.id === actualizada.id ? actualizada : t)
        );
      },
      error: () => {
        // Revierte si falla
        this.tareas.update(list =>
          list.map(t => t.id === tarea.id ? tarea : t)
        );
      },
    });
  }

  estaVencida(tarea: Tarea): boolean {
    if (!tarea.fecha_limite || tarea.completada) return false;
    return new Date(tarea.fecha_limite) < new Date();
  }

  formatearFecha(iso: string | null): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  private cargarTareas(bodaId: number): void {
    this.cargando.set(true);
    this.tareasApi.getByBoda(bodaId).subscribe({
      next:  (t) => { this.tareas.set(t); this.cargando.set(false); },
      error: ()  => this.cargando.set(false),
    });
  }
}
