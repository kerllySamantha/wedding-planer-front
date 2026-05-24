import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { PedirPresupuestoInfo } from '../Interfaces/PedirPresupuesto';

@Component({
  selector: 'app-card-info-solicitud',
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './card-info-solicitud.component.html',
  styleUrl: './card-info-solicitud.component.scss',
})
export class CardInfoSolicitudComponent {
  private route = inject(ActivatedRoute);
  protected empresaId = this.route.snapshot.params['id'];

  protected solicitud = signal<PedirPresupuestoInfo | null>(null);

  private pedirPresupuestoRoute = toSignal(
    this.route.data.pipe(
      map(data => {
        const solicitud = data['solicitud'] as PedirPresupuestoInfo | { data?: PedirPresupuestoInfo } | null | undefined;
        return (solicitud as { data?: PedirPresupuestoInfo } | null)?.data ?? (solicitud as PedirPresupuestoInfo | null) ?? null;
      })
    ),
    { initialValue: null }
  );

  protected puedeResponder = computed(() => {
    const estado = this.solicitud()?.estado as unknown;
    if (!estado) return false;
    const v = typeof estado === 'string' ? estado.toLowerCase() : '';
    return v === 'pendiente';
  });

  protected estadoVisual = computed(() => {
    const estado = this.solicitud()?.estado as unknown;
    if (!estado) return 'pendiente';
    const v = typeof estado === 'string' ? estado.toLowerCase() : '';
    if (['aceptado_usuario', 'aceptado_empresa', 'confirmado', 'confirmada'].includes(v)) return 'aceptada';
    if (['rechazado_usuario', 'rechazado_empresa', 'cancelado', 'cancelada'].includes(v)) return 'rechazada';
    if (v === 'pendiente_usuario') return 'en_revision';
    if (v === 'pendiente') return 'pendiente';
    return 'pendiente';
  });

  constructor() {
    effect(() => {
      const data = this.pedirPresupuestoRoute();
      if (data) this.solicitud.set(data);
    });
  }

  protected estadoLabel(estado?: unknown): string {
    if (!estado) return 'Sin estado';
    const v = typeof estado === 'string' ? estado.toLowerCase() : '';
    const map: Record<string, string> = {
      pendiente:          'Pendiente de respuesta',
      pendiente_usuario:  'Esperando respuesta del cliente',
      aceptado_usuario:   'Aceptado · pagado por cliente',
      aceptado_empresa:   'Aceptado',
      rechazado_usuario:  'Rechazado por el cliente',
      rechazado_empresa:  'Rechazado',
    };
    return map[v] ?? (estado as string);
  }
}
