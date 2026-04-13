import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { CountdownServiceService } from '../Services/countdown-service.service';
import { PerfilServiceServiceService } from '../Services/Perfiles/perfil-service-service.service';
import { NotificacionesService } from '../Services/Notificacion/notificaciones.service';
import { PedirPresupuestoService } from '../Services/PedirPresupuestos/pedir-presupuesto.service';
import { EchoService } from '../Services/Echo/echo.service';
import { Notificacion, NotificacionResponse } from '../Interfaces/Notificacion';
import { PerfilResponse } from '../Interfaces/Perfil';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-perfil-user',
  imports: [CommonModule, NavbarComponent],
  templateUrl: './perfil-user.component.html',
  styleUrl: './perfil-user.component.scss',
})
export class PerfilUserComponent implements OnInit, OnDestroy {

  // ── Servicios ─────────────────────────────────────────────────────────────

  private readonly perfilServiceCtx    = inject(PerfilServiceServiceService);
  private readonly notificacionesCtx   = inject(NotificacionesService);
  private readonly bodaCtx             = inject(CountdownServiceService);
  private readonly echoSvc             = inject(EchoService);
  private readonly pedirPresupuestoCtx = inject(PedirPresupuestoService);
  private readonly router              = inject(Router);

  // ── Estado público (signals) ──────────────────────────────────────────────

  // perfil se carga en ngOnInit como Observable y se almacena en signal tipado
  readonly perfil          = signal<PerfilResponse | null>(null);
  readonly boda            = this.bodaCtx.bodaEncontrada;
  readonly countdown       = this.bodaCtx.countdownValue;
  readonly fechaFormateada = this.bodaCtx.fechaFormateada;

  readonly notificaciones        = signal<Notificacion[]>([]);
  readonly notificacionesLoading = signal<boolean>(false);
  readonly notificacionesError   = signal<string | null>(null);
  readonly mensajeAccion         = signal<string | null>(null);

  // ── Estado privado ────────────────────────────────────────────────────────

  private readonly aceptandoIds  = signal<Set<string>>(new Set());
  private readonly aceptadosIds  = signal<Set<string>>(new Set());
  private readonly rechazandoIds = signal<Set<string>>(new Set());

  private unsubscribeNotificaciones: (() => void) | null = null;

  // ── Ciclo de vida ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    const userId = Number(localStorage.getItem('id'));

    this.perfilServiceCtx.getPerfilByUserId(userId).subscribe({
      next: (res) => {
        this.perfil.set(res);
        // Notificaciones dependen del id del perfil: las cargamos tras recibirlo
        this.cargarNotificaciones();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar perfil:', err);
      },
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeNotificaciones?.();
  }

  // ── Computed helpers ──────────────────────────────────────────────────────

  presupuestoGastado(): number {
    const boda = this.boda();
    if (!boda?.presupuestos) return 0;
    return boda.presupuestos.reduce((total, p) => total + p.monto_total, 0);
  }

  // ── Notificaciones ────────────────────────────────────────────────────────

  cargarNotificaciones(page = 1): void {
    const userId = this.perfil()?.data?.id;
    if (userId == null) {
      this.notificacionesError.set('Usuario no identificado.');
      return;
    }

    this.notificacionesLoading.set(true);
    this.notificacionesError.set(null);

    this.notificacionesCtx.getNotificaciones(userId, page).subscribe({
      next: (paginated) => {
        this.notificaciones.set(paginated.data);
        this.notificacionesLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        const msg = err.error?.message ?? err.error?.mensaje ?? 'Error al cargar notificaciones.';
        this.notificacionesError.set(msg);
        this.notificacionesLoading.set(false);
      },
    });
  }

  // ── Helpers de notificación ───────────────────────────────────────────────

  esPresupuesto(notif: Notificacion): boolean {
    return notif?.tipo === 'presupuesto';
  }

  presupuestoId(notif: Notificacion): string | null {
    const id = notif?.referencia?.id;
    return id != null ? String(id) : null;
  }

  importeOfertado(notif: Notificacion): number | null {
    return notif?.referencia?.importe_ofertado ?? null;
  }

  // ── Estado del presupuesto ────────────────────────────────────────────────

  private resolverEstadoPresupuesto(notif: Notificacion): string {
    const estado = notif?.referencia?.estado;
    if (!estado) return 'pendiente';
    // EstadoPedirPresupuesto es un objeto: devolvemos la clave con valor truthy
    return estado.aceptado_empresa || estado.rechazado_empresa || estado.pendiente || 'pendiente';
  }

  estadoPresupuestoTexto(notif: Notificacion): string {
    switch (this.resolverEstadoPresupuesto(notif)) {
      case 'pendiente_usuario':
      case 'aceptado_empresa':  return 'Pendiente de tu respuesta';
      case 'aceptado_usuario':  return 'Aceptado';
      case 'rechazado_usuario': return 'Rechazado por ti';
      case 'rechazado_empresa': return 'Rechazado por proveedor';
      case 'pendiente':         return 'Pendiente';
      default:                  return 'En gestión';
    }
  }

  puedeResponderPresupuesto(notif: Notificacion): boolean {
    const estado = this.resolverEstadoPresupuesto(notif);
    return (
      estado === 'pendiente_usuario' ||
      estado === 'aceptado_empresa'  ||
      estado === 'pendiente'
    );
  }

  // ── Flags de carga por ID ─────────────────────────────────────────────────

  aceptandoPresupuesto(id: string | null): boolean {
    return id != null && this.aceptandoIds().has(id);
  }

  presupuestoAceptado(id: string | null): boolean {
    return id != null && this.aceptadosIds().has(id);
  }

  rechazandoPresupuesto(id: string | null): boolean {
    return id != null && this.rechazandoIds().has(id);
  }

  private setFlag(
    set$: ReturnType<typeof signal<Set<string>>>,
    id: string,
    value: boolean
  ): void {
    set$.update(prev => {
      const next = new Set(prev);
      value ? next.add(id) : next.delete(id);
      return next;
    });
  }

  // ── Acciones ──────────────────────────────────────────────────────────────

  verDetallePresupuesto(notif: Notificacion): void {
    const id = this.presupuestoId(notif);
    if (id == null) {
      this.mensajeAccion.set('No se pudo abrir el detalle del presupuesto.');
      return;
    }

    if (notif?.id) {
      this.notificacionesCtx.marcarLeida(notif.id).subscribe({
        next: (_res: NotificacionResponse) => {
          this.notificaciones.update(prev =>
            prev.map(n => n.id === notif.id ? { ...n, leido: true } : n)
          );
        },
        error: () => { /* silencioso */ },
      });
    }

    this.router.navigate(['/presupuesto', id], {
      state: { presupuesto: notif.referencia ?? null },
    });
  }

  aceptarPresupuesto(notif: Notificacion): void {
    this.mensajeAccion.set(null);
    const id = this.presupuestoId(notif);

    if (id == null) {
      this.mensajeAccion.set('No se pudo identificar el presupuesto.');
      return;
    }
    if (this.aceptandoPresupuesto(id) || this.presupuestoAceptado(id)) return;

    this.setFlag(this.aceptandoIds, id, true);

    this.pedirPresupuestoCtx.aceptarPresupuesto(id).subscribe({
      next: () => {
        this.setFlag(this.aceptandoIds, id, false);
        this.setFlag(this.aceptadosIds, id, true);
        this.mensajeAccion.set('Fecha bloqueada correctamente.');
        this.cargarNotificaciones();
      },
      error: (err: HttpErrorResponse) => {
        this.setFlag(this.aceptandoIds, id, false);
        const msg = err.error?.message ?? err.error?.mensaje ?? 'No se pudo aceptar el presupuesto.';
        this.mensajeAccion.set(msg);
      },
    });
  }

  rechazarPresupuesto(notif: Notificacion): void {
    this.mensajeAccion.set(null);
    const id = this.presupuestoId(notif);

    if (id == null) {
      this.mensajeAccion.set('No se pudo identificar el presupuesto.');
      return;
    }
    if (this.rechazandoPresupuesto(id)) return;

    this.setFlag(this.rechazandoIds, id, true);

    this.pedirPresupuestoCtx.rechazarPresupuesto(id).subscribe({
      next: () => {
        this.setFlag(this.rechazandoIds, id, false);
        this.mensajeAccion.set('Presupuesto rechazado.');
        this.cargarNotificaciones();
      },
      error: (err: HttpErrorResponse) => {
        this.setFlag(this.rechazandoIds, id, false);
        const msg = err.error?.message ?? err.error?.mensaje ?? 'No se pudo rechazar el presupuesto.';
        this.mensajeAccion.set(msg);
      },
    });
  }
}