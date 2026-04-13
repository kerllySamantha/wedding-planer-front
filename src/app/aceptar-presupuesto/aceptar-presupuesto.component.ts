import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { PedirPresupuestoService } from '../Services/PedirPresupuestos/pedir-presupuesto.service';
import { ReservasServiceServiceService } from '../Services/Reservas/reservas-service-service.service';

@Component({
  selector: 'app-aceptar-presupuesto',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe, RouterLink, NavbarComponent],
  templateUrl: './aceptar-presupuesto.component.html',
  styleUrl: './aceptar-presupuesto.component.scss'
})
export class AceptarPresupuestoComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private presupuestoService = inject(PedirPresupuestoService);
  private reservasService = inject(ReservasServiceServiceService);

  presupuesto = signal<any | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  accionMensaje = signal<string | null>(null);
  procesandoAceptar = signal(false);
  procesandoRechazar = signal(false);
  procesandoPago = signal(false);
  reservaConfirmada = signal(false);
  reservaId = signal<number | string | null>(null);

  ngOnInit() {
    const nav = this.router.currentNavigation();
    let data = nav?.extras?.state?.['presupuesto'];

    if (!data) {
      data = history.state?.presupuesto;
    }

    if (data && data.id) {
      this.asignarPresupuesto(data);
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarPresupuesto(id);
    } else {
      this.error.set('No se ha indicado ningun presupuesto.');
    }
  }

  cargarPresupuesto(id: string) {
    this.loading.set(true);
    this.error.set(null);

    this.presupuestoService.getPedirPresupuesto(id).subscribe({
      next: (res) => {
        if (!res) {
          this.error.set('Presupuesto no encontrado.');
          this.presupuesto.set(null);
        } else {
          this.asignarPresupuesto(res);
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Error al cargar el presupuesto.');
        this.loading.set(false);
      }
    });
  }

  aceptar() {
    const id = this.presupuesto()?.id;
    if (!id || this.procesandoAceptar()) return;

    this.accionMensaje.set(null);
    this.procesandoAceptar.set(true);

    this.presupuestoService.aceptarPresupuesto(id).subscribe({
      next: (response) => {
        const reservaId = response?.reserva_id ?? response?.reserva?.id ?? this.reservaId();
        if (reservaId != null) {
          this.reservaId.set(reservaId);
          localStorage.setItem('reserva_id', String(reservaId));
        }

        this.procesandoAceptar.set(false);
        this.accionMensaje.set(response?.message ?? response?.mensaje ?? 'Presupuesto aceptado. La fecha ha quedado bloqueada.');
        this.cargarPresupuesto(String(id));
      },
      error: (err) => {
        console.error(err);
        this.procesandoAceptar.set(false);
        this.accionMensaje.set(err?.error?.message ?? err?.error?.mensaje ?? 'No se pudo aceptar el presupuesto.');
      }
    });
  }

  rechazar() {
    const id = this.presupuesto()?.id;
    if (!id || this.procesandoRechazar()) return;

    this.accionMensaje.set(null);
    this.procesandoRechazar.set(true);

    this.presupuestoService.rechazarPresupuesto(id).subscribe({
      next: () => {
        this.procesandoRechazar.set(false);
        this.accionMensaje.set('Presupuesto rechazado.');
        this.cargarPresupuesto(String(id));
      },
      error: (err) => {
        console.error(err);
        this.procesandoRechazar.set(false);
        this.accionMensaje.set(err?.error?.message ?? err?.error?.mensaje ?? 'No se pudo rechazar el presupuesto.');
      }
    });
  }

  simularPagoYConfirmarReserva() {
    const reservaId = this.reservaId();
    if (reservaId == null || this.procesandoPago()) return;

    this.accionMensaje.set(null);
    this.procesandoPago.set(true);

    this.reservasService.confirmarReserva(reservaId).subscribe({
      next: () => {
        this.procesandoPago.set(false);
        this.reservaConfirmada.set(true);
        this.accionMensaje.set('Pago simulado completado. La reserva ha pasado a confirmada.');
        const presupuestoId = this.presupuesto()?.id;
        if (presupuestoId) {
          this.cargarPresupuesto(String(presupuestoId));
        }
      },
      error: (err) => {
        console.error(err);
        this.procesandoPago.set(false);
        this.accionMensaje.set(err?.error?.message ?? err?.error?.mensaje ?? 'No se pudo confirmar la reserva.');
      }
    });
  }

  puedeAceptar(): boolean {
    return this.esEstadoPendienteUsuario(this.presupuesto()?.estado);
  }

  puedeRechazar(): boolean {
    return this.esEstadoPendienteUsuario(this.presupuesto()?.estado);
  }

  puedeConfirmarReserva(): boolean {
    return !this.puedeAceptar() && !!this.reservaId() && !this.reservaConfirmada();
  }

  mostrarHorario(): boolean {
    return this.presupuesto()?.modalidad === 'servicio';
  }

  private asignarPresupuesto(presupuesto: any) {
    this.presupuesto.set(presupuesto);
    this.reservaId.set(this.obtenerReservaId(presupuesto));
    this.reservaConfirmada.set(this.obtenerEstadoReserva(presupuesto) === 'confirmada');
  }

  private esEstadoPendienteUsuario(estado: unknown): boolean {
    const valor = this.normalizarEstado(estado);
    return valor === 'pendiente_usuario' || valor === 'pendiente';
  }

  private normalizarEstado(estado: unknown): string {
    if (!estado) return 'pendiente';
    if (typeof estado === 'string') return estado.toLowerCase();
    if (typeof estado === 'object') {
      const estadoObj = estado as Record<string, unknown>;
      return String(
        estadoObj['aceptado_empresa']
        ?? estadoObj['rechazado_empresa']
        ?? estadoObj['pendiente']
        ?? 'pendiente'
      ).toLowerCase();
    }
    return 'pendiente';
  }

  private obtenerReservaId(presupuesto: any): number | string | null {
    return (
      presupuesto?.reserva_id ??
      presupuesto?.reserva?.id ??
      null
    );
  }

  private obtenerEstadoReserva(presupuesto: any): string | null {
    return (
      presupuesto?.reserva?.estado ??
      presupuesto?.estado_reserva ??
      null
    );
  }

  mapEstado(estado: unknown): string {
    switch (this.normalizarEstado(estado)) {
      case 'aceptado_usuario':
      case 'accepted':
      case 'aceptada':
        return 'Aceptado';
      case 'rechazado_usuario':
      case 'rechazado_empresa':
      case 'cancelled':
      case 'cancelada':
        return 'Rechazado';
      case 'aceptado_empresa':
      case 'pendiente_usuario':
        return 'Pendiente de cliente';
      case 'pending':
      case 'pendiente':
        return 'Pendiente';
      default:
        return 'En gestion';
    }
  }

  presupuestoFormateado = computed(() => {
    const p = this.presupuesto();
    if (!p) return null;

    return {
      ...p,
      estadoTexto: this.mapEstado(p.estado),
      reservaId: this.obtenerReservaId(p),
      estadoReserva: this.obtenerEstadoReserva(p),
      modalidadTexto: p.modalidad === 'servicio' ? 'Servicio' : p.modalidad === 'producto' ? 'Producto' : 'No especificada'
    };
  });
}