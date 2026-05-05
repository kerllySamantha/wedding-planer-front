import { Component, computed, inject } from '@angular/core';
import { CountdownServiceService } from '../Services/countdown-service.service';

@Component({
  selector: 'app-card-actividades-novia',
  imports: [],
  templateUrl: './card-actividades-novia.component.html',
  styleUrl: './card-actividades-novia.component.scss',
})
export class CardActividadesNoviaComponent {
  countdownService = inject(CountdownServiceService);

  ngOnInit() {
    this.countdownService.cargarBodaDelUsuario();
  }

  ngOnDestroy() {
    this.countdownService.stopCountdown();
  }

  bodaEncontrada = computed(() => this.countdownService.bodaEncontrada());
  fechaCountdown = computed(() => this.countdownService.countdownValue());
  fechaFormateada = computed(() => this.countdownService.fechaFormateada());
  serviciosContratados = computed(() => {
    const presupuestos = this.bodaEncontrada()?.presupuestos ?? [];
    return presupuestos.filter((p) => p.estado === 'aceptado_usuario' || p.estado === 'aceptado_empresa').length;
  });
  tareasCompletadas = computed(() => {
    const presupuestos = this.bodaEncontrada()?.presupuestos ?? [];
    return presupuestos.filter((p) => (p.monto_restante ?? (p.monto_total - (p.monto_pagado ?? 0))) <= 0).length;
  });
  presupuestoGastado = computed(() => this.countdownService.totalPagado());

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(valor || 0);
  }

  formatearNombrePareja(nombre: string | null | undefined): string {
    if (!nombre) return 'Nuestra Boda';

    const palabras = nombre
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1));

    const primerasDos = palabras.slice(0, 2).join(' ');
    return primerasDos || 'Nuestra Boda';
  }
}
