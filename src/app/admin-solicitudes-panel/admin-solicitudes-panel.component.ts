import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { PedirPresupuestoService } from '../Services/PedirPresupuestos/pedir-presupuesto.service';
import { PedirPresupuestoInfo } from '../Interfaces/PedirPresupuesto';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type EstadoVisual = 'aceptada' | 'rechazada' | 'pendiente' | 'en_revision';

@Component({
  selector: 'app-admin-solicitudes-panel',
  imports: [MatTableModule, CommonModule, RouterLink, MatIcon],
  templateUrl: './admin-solicitudes-panel.component.html',
  styleUrl: './admin-solicitudes-panel.component.scss',
})
export class AdminSolicitudesPanelComponent {
  pedirPresupuestosctx = inject(PedirPresupuestoService);
  private destroyRef = inject(DestroyRef);

  arrayInfoPresupuestos = signal<PedirPresupuestoInfo[] | null>(null);
  idEmpresa = signal<string>(localStorage.getItem('idEmpresa')!);
  displayedColumns: string[] = ['cliente', 'fecha', 'importe', 'estado', 'acciones'];

  totalSolicitudes = computed(() => this.arrayInfoPresupuestos()?.length ?? 0);
  totalAceptadas   = computed(() => this.contarPorEstado('aceptada'));
  totalRechazadas  = computed(() => this.contarPorEstado('rechazada'));
  totalPendientes  = computed(() => this.contarPorEstado('pendiente'));
  totalEnRevision  = computed(() => this.contarPorEstado('en_revision'));

  ngOnInit() {
    this.getPedirPresupuestoEmpresa();
    interval(12000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.getPedirPresupuestoEmpresa());
  }

  getPedirPresupuestoEmpresa() {
    const idEmpresa = this.idEmpresa();
    if (!idEmpresa) {
      this.arrayInfoPresupuestos.set([]);
      return;
    }
    this.pedirPresupuestosctx.getEmpresaPedirPresupuesto(idEmpresa).subscribe({
      next: (value) => this.arrayInfoPresupuestos.set(value ?? []),
    });
  }

  formaterFecha(fecha?: string | null) {
    if (!fecha) return '-';
    return fecha.split('T')[0];
  }

  formatImporte(importe?: number | null): string {
    if (!importe && importe !== 0) return '-';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(importe);
  }

  estadoVisual(estado?: unknown): EstadoVisual {
    const value = this.normalizarEstado(estado);

    if (['aceptada', 'aceptado', 'aprobada', 'confirmada', 'confirmado', 'aceptado_usuario', 'aceptado_empresa'].includes(value)) {
      return 'aceptada';
    }
    if (['rechazada', 'rechazado', 'cancelada', 'cancelado', 'denegada', 'rechazado_usuario', 'rechazado_empresa'].includes(value)) {
      return 'rechazada';
    }
    if (['pendiente', 'pending', 'nueva', 'nuevo'].includes(value)) {
      return 'pendiente';
    }

    return 'en_revision';
  }

  estadoLabel(estado?: unknown): string {
    const value = this.normalizarEstado(estado);
    if (value === 'aceptado_usuario')  return 'Aceptado · pagado';
    if (value === 'rechazado_usuario') return 'Rechazado por cliente';
    if (value === 'rechazado_empresa') return 'Rechazado';
    if (value === 'pendiente_usuario') return 'Esperando cliente';

    const visual = this.estadoVisual(estado);
    if (visual === 'aceptada')   return 'Aceptada';
    if (visual === 'rechazada')  return 'Rechazada';
    if (visual === 'pendiente')  return 'Pendiente';
    return 'En revisión';
  }

  puedeResponder(estado?: unknown): boolean {
    return this.normalizarEstado(estado) === 'pendiente';
  }

  private normalizarEstado(estado: unknown): string {
    if (typeof estado === 'string') return estado.toLowerCase();

    if (estado && typeof estado === 'object') {
      const estadoObj = estado as Record<string, unknown>;
      const flagActivo = Object.keys(estadoObj).find(
        (key) => estadoObj[key] === true || estadoObj[key] === '1' || estadoObj[key] === 1,
      );
      if (flagActivo) return flagActivo.toLowerCase();

      const valorTexto = Object.values(estadoObj).find(
        (value) => typeof value === 'string' && value.length > 0,
      );
      if (typeof valorTexto === 'string') return valorTexto.toLowerCase();
    }

    return '';
  }

  private contarPorEstado(estado: EstadoVisual) {
    return (this.arrayInfoPresupuestos() ?? []).filter(
      (solicitud) => this.estadoVisual(solicitud.estado) === estado,
    ).length;
  }
}
