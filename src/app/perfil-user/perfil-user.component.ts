import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
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
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-perfil-user',
  imports: [CommonModule, NavbarComponent],
  templateUrl: './perfil-user.component.html',
  styleUrl: './perfil-user.component.scss',
})
export class PerfilUserComponent implements OnInit, OnDestroy {
  private readonly perfilServiceCtx = inject(PerfilServiceServiceService);
  private readonly notificacionesCtx = inject(NotificacionesService);
  private readonly bodaCtx = inject(CountdownServiceService);
  private readonly echoSvc = inject(EchoService);
  private readonly pedirPresupuestoCtx = inject(PedirPresupuestoService);
  private readonly router = inject(Router);

  readonly perfil = signal<PerfilResponse | null>(null);
  readonly boda = this.bodaCtx.bodaEncontrada;
  readonly countdown = this.bodaCtx.countdownValue;
  readonly fechaFormateada = this.bodaCtx.fechaFormateada;

  readonly notificaciones = signal<Notificacion[]>([]);
  readonly notificacionesLoading = signal<boolean>(false);
  readonly notificacionesError = signal<string | null>(null);
  readonly mensajeAccion = signal<string | null>(null);
  readonly expandedNotifId = signal<number | string | null>(null);

  readonly notificacionesNoLeidas = computed(
    () => this.notificaciones().filter((n) => !this.esLeida(n)).length,
  );
  readonly presupuestosOrdenados = computed(() =>
    [...(this.boda()?.presupuestos ?? [])].sort(
      (a, b) =>
        new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime(),
    ),
  );
  readonly presupuestoTotal = computed(() =>
    this.presupuestosOrdenados().reduce((total, p) => total + (p.monto_total ?? 0), 0),
  );
  readonly presupuestoPagado = computed(() =>
    this.presupuestosOrdenados().reduce((total, p) => total + (p.monto_pagado ?? 0), 0),
  );
  readonly presupuestoPendiente = computed(() =>
    Math.max(0, this.presupuestoTotal() - this.presupuestoPagado()),
  );

  private readonly aceptandoIds = signal<Set<string>>(new Set());
  private readonly aceptadosIds = signal<Set<string>>(new Set());
  private readonly rechazandoIds = signal<Set<string>>(new Set());
  private unsubscribeNotificaciones: (() => void) | null = null;

  ngOnInit(): void {
    const userId = Number(localStorage.getItem('id'));

    if (!userId) {
      console.error('Usuario no identificado');
      return;
    }

    this.bodaCtx.cargarBodaDelUsuario();

    this.perfilServiceCtx.getPerfilByUserId(userId).subscribe({
      next: (res) => {
        this.perfil.set(res);
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

  cargarPerfil(userId: number): void {
    this.perfilServiceCtx.getPerfilByUserId(userId).subscribe({
      next: (res) => {
        this.perfil.set(res);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar perfil:', err);
      },
    });
  }

  presupuestoGastado(): number {
    const boda = this.boda();
    if (!boda?.presupuestos) return 0;
    return boda.presupuestos.reduce((total, p) => total + p.monto_total, 0);
  }

  cargarNotificaciones(page = 1): void {
    const userId = Number(localStorage.getItem('id'));
    if (!userId) {
      this.notificacionesError.set('Usuario no identificado.');
      return;
    }

    this.notificacionesLoading.set(true);
    this.notificacionesError.set(null);

    this.notificacionesCtx.getNotificaciones(userId, page).pipe(
      map((paginated) => this.normalizarNotificaciones(paginated.data ?? [])),
      switchMap((base) => this.sincronizarSolicitudesPresupuesto(base)),
    ).subscribe({
      next: (notificaciones) => {
        this.notificaciones.set(notificaciones);
        this.notificacionesLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        const msg =
          err.error?.message ??
          err.error?.mensaje ??
          'Error al cargar notificaciones.';
        this.notificacionesError.set(msg);
        this.notificacionesLoading.set(false);
      },
    });
  }

  eliminarNotificacion(notif: Notificacion): void {
    if (!notif?.id) return;

    this.notificacionesCtx.eliminarNotificacion(Number(notif.id)).subscribe({
      next: () => {
        this.notificaciones.update((prev) => prev.filter((n) => n.id !== notif.id));
        this.mensajeAccion.set('Notificación eliminada.');
      },
      error: (err: HttpErrorResponse) => {
        this.mensajeAccion.set(
          err.error?.message ??
          err.error?.mensaje ??
          'No se pudo eliminar la notificación.',
        );
      },
    });
  }

  toggleExpandNotification(notif: Notificacion): void {
    const id = notif?.id ?? null;
    this.expandedNotifId.update((current) => (current === id ? null : id));
  }

  estaExpandida(notif: Notificacion): boolean {
    return this.expandedNotifId() === (notif?.id ?? null);
  }

  esLeida(notif?: Notificacion | null): boolean {
    if (!notif) return false;
    const v = notif.leido;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v === 1;
    return false;
  }

  esPresupuesto(notif: Notificacion): boolean {
    const tipo = (notif?.tipo ?? '').toLowerCase();
    return tipo.includes('presupuesto');
  }

  esReserva(notif: Notificacion): boolean {
    const tipo = (notif?.tipo ?? '').toLowerCase();
    return tipo.includes('reserva');
  }

  presupuestoId(notif: Notificacion): string | null {
    const ref = notif?.referencia as Record<string, unknown> | null;
    const id =
      ref?.['pedir_presupuesto_id'] ??
      ref?.['id'] ??
      notif?.referencia_id ??
      null;

    return id != null ? String(id) : null;
  }

  importeOfertado(notif: Notificacion): number | null {
    const value = notif?.referencia?.importe_ofertado;
    if (value == null) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  private resolverEstadoPresupuesto(notif: Notificacion): string {
    const estado = notif?.referencia?.estado as unknown;
    if (!estado) return 'pendiente';

    if (typeof estado === 'string') {
      return estado.toLowerCase();
    }

    if (typeof estado === 'object') {
      const estadoObj = estado as Record<string, string>;
      return String(
        estadoObj['aceptado_usuario'] ||
          estadoObj['rechazado_usuario'] ||
          estadoObj['pendiente_usuario'] ||
          estadoObj['aceptado_empresa'] ||
          estadoObj['rechazado_empresa'] ||
          estadoObj['pendiente'] ||
          'pendiente',
      ).toLowerCase();
    }

    return 'pendiente';
  }

  estadoPresupuestoTexto(notif: Notificacion): string {
    switch (this.resolverEstadoPresupuesto(notif)) {
      case 'pendiente_usuario':
      case 'aceptado_empresa':
        return 'Pendiente de tu respuesta';
      case 'aceptado_usuario':
        return 'Aceptado';
      case 'rechazado_usuario':
        return 'Rechazado por ti';
      case 'rechazado_empresa':
        return 'Rechazado por proveedor';
      case 'pendiente':
        return 'Pendiente';
      default:
        return 'En gestión';
    }
  }

  puedeResponderPresupuesto(notif: Notificacion): boolean {
    const estado = this.resolverEstadoPresupuesto(notif);
    return (
      estado === 'pendiente_usuario' ||
      estado === 'aceptado_empresa' ||
      estado === 'pendiente'
    );
  }

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
    value: boolean,
  ): void {
    set$.update((prev) => {
      const next = new Set(prev);
      value ? next.add(id) : next.delete(id);
      return next;
    });
  }

  marcarLeida(notif: Notificacion): void {
    if (!notif?.id || this.esLeida(notif)) return;

    this.notificacionesCtx.marcarLeida(notif.id).subscribe({
      next: (_res: NotificacionResponse) => {
        this.notificaciones.update((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, leido: true } : n)),
        );
      },
      error: () => {},
    });
  }

  abrirNotificacion(notif: Notificacion): void {
    if (this.esPresupuesto(notif)) {
      const id = this.presupuestoId(notif);

      if (id == null) {
        this.mensajeAccion.set('No se pudo abrir el detalle del presupuesto.');
        return;
      }

      this.router.navigate(['/presupuesto', id], {
        state: { presupuesto: notif.referencia ?? null },
      });
      return;
    }

    this.mensajeAccion.set('Abriendo detalle de la notificación.');
  }

  nombreProveedor(notif: Notificacion): string {
    const referencia = notif?.referencia as Record<string, any> | null;
    return (
      referencia?.['empresa']?.nombre ??
      referencia?.['proveedor']?.nombre ??
      referencia?.['nombre_empresa'] ??
      'Proveedor'
    );
  }

  tipoPresupuestoTexto(presupuesto: any): string {
    return (
      presupuesto?.tipos?.nombre ??
      presupuesto?.tipo_producto?.nombre ??
      presupuesto?.nombre ??
      'Servicio'
    );
  }

  estadoPresupuestoDesdePresupuesto(presupuesto: any): string {
    const notifMock = { referencia: { estado: presupuesto?.estado } } as Notificacion;
    return this.estadoPresupuestoTexto(notifMock);
  }

  verDetallePresupuesto(notif: Notificacion): void {
    this.abrirNotificacion(notif);
  }

  aceptarPresupuesto(notif: Notificacion): void {
    this.mensajeAccion.set(null);

    if (!this.esPresupuesto(notif)) {
      this.mensajeAccion.set(
        'Esta notificación no corresponde a un presupuesto.',
      );
      return;
    }

    const id = this.presupuestoId(notif);
    console.log('ACEPTAR PERFIL -> notif', notif);
    console.log('ACEPTAR PERFIL -> id enviado', id);

    if (id == null) {
      this.mensajeAccion.set('No se pudo identificar el presupuesto.');
      return;
    }

    if (this.aceptandoPresupuesto(id) || this.presupuestoAceptado(id)) return;

    this.setFlag(this.aceptandoIds, id, true);

    this.pedirPresupuestoCtx.aceptarPresupuesto(id).subscribe({
      next: (res) => {
        this.setFlag(this.aceptandoIds, id, false);
        this.setFlag(this.aceptadosIds, id, true);
        this.mensajeAccion.set('Fecha bloqueada correctamente.');
        console.log('ACEPTAR PERFIL -> respuesta backend', res);
        this.cargarNotificaciones();
      },
      error: (err: HttpErrorResponse) => {
        this.setFlag(this.aceptandoIds, id, false);
        const msg =
          err.error?.message ??
          err.error?.mensaje ??
          'No se pudo aceptar el presupuesto.';
        this.mensajeAccion.set(msg);
        console.error('ACEPTAR PERFIL -> error backend', err);
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
        const msg =
          err.error?.message ??
          err.error?.mensaje ??
          'No se pudo rechazar el presupuesto.';
        this.mensajeAccion.set(msg);
      },
    });
  }

  private normalizarNotificaciones(notificaciones: Notificacion[]): Notificacion[] {
    return notificaciones.map((notif) => {
      const referencia = notif?.referencia as Record<string, unknown> | null;
      const fallbackRefId = (
        referencia?.['pedir_presupuesto_id'] ??
        referencia?.['id'] ??
        notif.referencia_id ??
        null
      ) as string | number | null;

      return {
        ...notif,
        referencia_id: fallbackRefId,
      };
    });
  }

  private sincronizarSolicitudesPresupuesto(
    notificaciones: Notificacion[],
  ): Observable<Notificacion[]> {
    const solicitudes = notificaciones
      .filter((notif) => this.esPresupuesto(notif))
      .map((notif) => ({
        notifId: notif.id,
        solicitudId: this.presupuestoId(notif),
      }))
      .filter((item) => item.solicitudId != null) as Array<{
      notifId: number;
      solicitudId: string;
    }>;

    if (solicitudes.length === 0) {
      return of(notificaciones);
    }

    const solicitudesUnicas = Array.from(
      new Set(solicitudes.map((item) => item.solicitudId)),
    );

    const requestMap: Record<string, Observable<any | null>> = {};
    solicitudesUnicas.forEach((id) => {
      requestMap[id] = this.pedirPresupuestoCtx.getPedirPresupuesto(id).pipe(
        catchError(() => of(null)),
      );
    });

    return forkJoin(requestMap).pipe(
      map((detallePorSolicitud) =>
        notificaciones.map((notif) => {
          if (!this.esPresupuesto(notif)) return notif;
          const solicitudId = this.presupuestoId(notif);
          if (!solicitudId) return notif;

          const solicitudActualizada = detallePorSolicitud[solicitudId] ?? null;
          if (!solicitudActualizada) return notif;

          return {
            ...notif,
            referencia_id: solicitudId,
            referencia: {
              ...(notif.referencia ?? {}),
              ...solicitudActualizada,
            },
          };
        }),
      ),
    );
  }

}
