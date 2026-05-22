import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { PedirPresupuestoService } from '../Services/PedirPresupuestos/pedir-presupuesto.service';
import { ReservasServiceServiceService } from '../Services/Reservas/reservas-service-service.service';
import { StripeService } from '../Services/Stripe/stripe.service';
import { EstadoPresupuesto } from '../Interfaces/Presupuesto';
import { Stripe, StripeCardElement, StripeElements } from '@stripe/stripe-js';

@Component({
  selector: 'app-aceptar-presupuesto',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe, RouterLink, NavbarComponent],
  templateUrl: './aceptar-presupuesto.component.html',
  styleUrl: './aceptar-presupuesto.component.scss',
})
export class AceptarPresupuestoComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private presupuestoService = inject(PedirPresupuestoService);
  private reservasService = inject(ReservasServiceServiceService);
  private stripeService = inject(StripeService);

  presupuesto = signal<any | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  accionMensaje = signal<string | null>(null);
  procesandoAceptar = signal(false);
  procesandoRechazar = signal(false);
  procesandoPago = signal(false);
  reservaId = signal<number | string | null>(null);
  mostrandoFormaPago = signal(false);
  errorPago = signal<string | null>(null);

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private cardElement: StripeCardElement | null = null;

  ngOnInit() {
    const nav = this.router.currentNavigation();
    let data = nav?.extras?.state?.['presupuesto'];

    if (!data) {
      data = history.state?.presupuesto;
    }

    const idDesdeState = data?.id;
    const idDesdeRuta = this.route.snapshot.paramMap.get('id');

    if (data && data.id) {
      this.asignarPresupuesto(data);
      this.cargarPresupuesto(String(data.id));
      return;
    }

    const idFinal = idDesdeState ?? idDesdeRuta;

    if (idFinal) {
      this.cargarPresupuesto(String(idFinal));
    } else {
      this.error.set('No se ha indicado ningun presupuesto.');
    }
  }

  cargarPresupuesto(id: string) {
    this.loading.set(true);
    this.error.set(null);
    this.reservaId.set(null);

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
      },
    });
  }

  aceptar() {
    const id = this.presupuesto()?.id;
    if (!id || this.procesandoAceptar()) return;

    this.accionMensaje.set(null);
    this.procesandoAceptar.set(true);

    this.presupuestoService.aceptarPresupuesto(id).subscribe({
      next: (response) => {
        const reservaId =
          response?.reserva_id ?? response?.reserva?.id ?? this.reservaId();
        if (reservaId != null) {
          this.reservaId.set(reservaId);
        }

        this.procesandoAceptar.set(false);
        this.accionMensaje.set(
          response?.message ??
            response?.mensaje ??
            'Presupuesto aceptado. La fecha ha quedado bloqueada.',
        );
        this.cargarPresupuesto(String(id));
      },
      error: (err) => {
        console.error(err);
        this.procesandoAceptar.set(false);
        this.accionMensaje.set(
          err?.error?.message ??
            err?.error?.mensaje ??
            'No se pudo aceptar el presupuesto.',
        );
      },
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
        this.accionMensaje.set(
          err?.error?.message ??
            err?.error?.mensaje ??
            'No se pudo rechazar el presupuesto.',
        );
      },
    });
  }

  async mostrarFormaPago() {
    if (this.mostrandoFormaPago() || this.procesandoPago()) return;

    if (!this.stripe) {
      this.stripe = await this.stripeService.getStripe();
    }

    this.mostrandoFormaPago.set(true);
    this.errorPago.set(null);

    // Wait for Angular to render the #card-element div
    await new Promise(resolve => setTimeout(resolve, 0));

    const container = document.getElementById('card-element');
    if (container && this.stripe) {
      this.elements = this.stripe.elements();
      this.cardElement = this.elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#2f2528',
            fontFamily: 'inherit',
            '::placeholder': { color: '#a08090' },
          },
          invalid: { color: '#982949' },
        },
      });
      this.cardElement.mount(container);
    }
  }

  async pagarYConfirmar() {
    const reservaId = this.reservaId();
    if (!reservaId || !this.stripe || !this.cardElement || this.procesandoPago()) return;

    this.procesandoPago.set(true);
    this.errorPago.set(null);

    try {
      const clientSecret = await this.stripeService.createPaymentIntent(reservaId);

      const result = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: this.cardElement },
      });

      if (result.error) {
        this.errorPago.set(result.error.message ?? 'Error al procesar el pago.');
        this.procesandoPago.set(false);
        return;
      }

      // Payment succeeded — confirm reservation in Laravel
      this.reservasService.confirmarReserva(reservaId).subscribe({
        next: () => {
          this.procesandoPago.set(false);
          this.mostrandoFormaPago.set(false);
          this.accionMensaje.set('Pago completado. La reserva está confirmada.');
          const presupuestoId = this.presupuesto()?.id;
          if (presupuestoId) this.cargarPresupuesto(String(presupuestoId));
        },
        error: () => {
          // Webhook will confirm the reservation automatically
          this.procesandoPago.set(false);
          this.mostrandoFormaPago.set(false);
          this.accionMensaje.set('Pago recibido. La reserva se confirmará en breve.');
          const presupuestoId = this.presupuesto()?.id;
          if (presupuestoId) this.cargarPresupuesto(String(presupuestoId));
        },
      });
    } catch {
      this.errorPago.set('Error inesperado. Inténtalo de nuevo.');
      this.procesandoPago.set(false);
    }
  }

  cancelarPago() {
    this.cardElement?.destroy();
    this.cardElement = null;
    this.elements = null;
    this.mostrandoFormaPago.set(false);
    this.errorPago.set(null);
  }

  puedeAceptar(): boolean {
    const estado = this.normalizarEstado(this.presupuesto()?.estado);
    if (this.esReservaConfirmada()) return false;

    return estado === 'pendiente_usuario' || estado === 'aceptado_empresa';
  }

  puedeRechazar(): boolean {
    const estado = this.normalizarEstado(this.presupuesto()?.estado);
    if (this.esReservaConfirmada()) return false;

    return estado === 'pendiente_usuario' || estado === 'aceptado_empresa';
  }

  puedeConfirmarReserva(): boolean {
    const estadoReserva = this.estadoReservaActual();
    return (
      estadoReserva === 'bloqueada' &&
      !!this.reservaId() &&
      !this.esReservaConfirmada()
    );
  }

  mostrarHorario(): boolean {
    return this.presupuesto()?.modalidad === 'servicio';
  }

  private asignarPresupuesto(presupuesto: any) {
    this.presupuesto.set(presupuesto);

    const reservaIdDetectada = this.obtenerReservaId(presupuesto);

    if (reservaIdDetectada != null) {
      this.reservaId.set(reservaIdDetectada);
    }
  }

  private normalizarEstado(estado: unknown): string {
    if (!estado) return 'pendiente';

    if (typeof estado === 'string') {
      return estado.toLowerCase();
    }

    if (typeof estado === 'object') {
      const estadoObj = estado as Record<string, unknown>;

      return String(
        estadoObj['aceptado_usuario'] ??
          estadoObj['rechazado_usuario'] ??
          estadoObj['aceptado_empresa'] ??
          estadoObj['rechazado_empresa'] ??
          estadoObj['pendiente_usuario'] ??
          estadoObj['pendiente'] ??
          'pendiente',
      ).toLowerCase();
    }

    return 'pendiente';
  }

  private obtenerReservaId(presupuesto: any): number | string | null {
    return presupuesto?.reserva_id ?? presupuesto?.reserva?.id ?? null;
  }

  private obtenerEstadoReserva(presupuesto: any): string | null {
    return presupuesto?.reserva?.estado ?? presupuesto?.estado_reserva ?? null;
  }

  private estadoReservaActual(): string {
    return (this.obtenerEstadoReserva(this.presupuesto()) ?? '').toLowerCase();
  }

  esReservaConfirmada(): boolean {
    return this.estadoReservaActual() === 'confirmada';
  }

  estadoFinalTexto(): string {
    const p = this.presupuesto();
    if (!p) return 'Pendiente';

    const estadoPresupuesto = this.normalizarEstado(p.estado);
    const estadoReserva = (this.obtenerEstadoReserva(p) ?? '').toLowerCase();

    if (estadoReserva === 'confirmada') {
      return 'Aceptado y pagado';
    }

    if (estadoReserva === 'bloqueada') {
      return 'Aceptado y fecha bloqueada';
    }

    if (estadoPresupuesto === 'aceptado_usuario') {
      return 'Aceptado';
    }

    if (
      estadoPresupuesto === 'aceptado_empresa' ||
      estadoPresupuesto === 'pendiente_usuario'
    ) {
      return 'Pendiente de tu confirmación';
    }

    if (estadoPresupuesto === 'rechazado_usuario') {
      return 'Rechazado por ti';
    }

    if (estadoPresupuesto === 'rechazado_empresa') {
      return 'Rechazado por proveedor';
    }

    return 'Pendiente';
  }

  mapEstado(estado: EstadoPresupuesto): string {
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
      estadoTexto: this.estadoFinalTexto(),
      reservaId: this.obtenerReservaId(p),
      estadoReserva: this.obtenerEstadoReserva(p),
      modalidadTexto:
        p.modalidad === 'servicio'
          ? 'Servicio'
          : p.modalidad === 'producto'
            ? 'Producto'
            : 'No especificada',
    };
  });
}
