import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
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

  constructor() {
    effect(() => {
      const data = this.pedirPresupuestoRoute();
      if (data) {
        this.solicitud.set(data);
      }
    });
  }
}
