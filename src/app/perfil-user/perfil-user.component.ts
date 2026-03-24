import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { CountdownServiceService } from '../Services/countdown-service.service';
import { PerfilServiceServiceService } from '../Services/Perfiles/perfil-service-service.service';
import { Perfil } from '../Interfaces/Perfil';
import { NotificacionesService } from '../Services/Notificacion/notificaciones.service';
import { Notificacion } from '../Interfaces/Notificacion';
import { PedirPresupuestoService } from '../Services/PedirPresupuestos/pedir-presupuesto.service';
import { EchoService } from '../Services/Echo/echo.service';

@Component({
  selector: 'app-perfil-user',
  imports: [CommonModule, NavbarComponent],
  templateUrl: './perfil-user.component.html',
  styleUrl: './perfil-user.component.scss'
})
export class PerfilUserComponent {

  countdownService = inject(CountdownServiceService);
  perfilServicectx = inject(PerfilServiceServiceService);
  notificacionesCtx = inject(NotificacionesService);
  pedirPresupuestoCtx = inject(PedirPresupuestoService);
  echoSvc = inject(EchoService);


  userPerfil = signal<Perfil | null>(null);
  public loading = signal(true);
  public error = signal<string | null>(null);


  bodaEncontrada = computed(() => this.countdownService.bodaEncontrada());
  fechaCountdown = computed(() => this.countdownService.countdownValue());
  fechaFormateada = computed(() => this.countdownService.fechaFormateada())

  perfil = computed(() => this.userPerfil());

  notificaciones = signal<Notificacion[]>([]);
  notificacionesLoading = signal(false);
  notificacionesError = signal<string | null>(null);
  mensajeAccion = signal<string | null>(null);

  private aceptandoPresupuestoIds = signal<Set<string>>(new Set());
  private aceptadosPresupuestoIds = signal<Set<string>>(new Set());
  private unsubscribeNotificaciones: (() => void) | null = null;





  ngOnInit() {
    this.cargarPerfilDelUsuario();
    this.countdownService.cargarBodaDelUsuario();
    this.cargarNotificaciones();
    this.iniciarEscuchaNotificaciones();

  }

  presupuestoGastado(): number {
    const boda = this.bodaEncontrada();
    if (!boda || !boda.presupuestos) return 0;

   
    return boda.presupuestos.reduce((total, p) => total + p.monto_total, 0);
  }







  cargarPerfilDelUsuario() {
    const usuarioId = Number(localStorage.getItem('id'));
    if (!usuarioId) {
      this.error.set('No hay usuario logueado');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    this.perfilServicectx.getPerfilByUserId(usuarioId).subscribe({
      next: (res) => {
        const perfilData = res || null;
        this.userPerfil.set(perfilData?.data || null);
        console.log(this.perfil())
        console.log(this.fechaFormateada())

        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  cargarNotificaciones() {
    const usuarioId = Number(localStorage.getItem('id'));
    if (!usuarioId) {
      this.notificaciones.set([]);
      return;
    }

    if (this.notificacionesLoading()) return;
    this.notificacionesLoading.set(true);
    this.notificacionesError.set(null);

    this.notificacionesCtx.getNotificaciones(usuarioId, 1).subscribe({
      next: (res) => {
        this.notificaciones.set(res?.data ?? []);
        this.notificacionesLoading.set(false);
      },
      error: (err) => {
        this.notificacionesError.set(err?.message ?? 'No se pudieron cargar las notificaciones');
        this.notificacionesLoading.set(false);
      }
    });
  }

  esNotificacionPresupuesto(notif: Notificacion): boolean {
    const tipo = (notif?.tipo ?? '').toLowerCase();
    if (tipo.includes('presupuesto')) return true;
    const ref: any = notif?.referencia;
    return !!(ref && (ref.importe_ofertado != null || ref.presupuesto != null));
  }

  obtenerPresupuestoId(notif: Notificacion): string | number | null {
    const ref: any = notif?.referencia;
    return (
      ref?.id ??
      ref?.presupuesto_id ??
      notif?.referencia_id ??
      null
    );
  }

  obtenerImporteOfertado(notif: Notificacion): number | null {
    const ref: any = notif?.referencia;
    const importe = ref?.importe_ofertado;
    if (importe == null) return null;
    const num = Number(importe);
    return Number.isFinite(num) ? num : null;
  }

  obtenerEstadoPresupuesto(notif: Notificacion): string {
    const ref: any = notif?.referencia;
    const estado = ref?.estado;
    if (!estado) return 'pendiente';
    if (typeof estado === 'string') return estado;
    if (typeof estado === 'object') {
      return estado.aceptado_empresa || estado.rechazado_empresa || estado.pendiente || 'pendiente';
    }
    return 'pendiente';
  }

  obtenerModalidadReferencia(notif: Notificacion): string | null {
    const ref: any = notif?.referencia;
    return ref?.modalidad ?? null;
  }

  obtenerProductoReferencia(notif: Notificacion): number | string | null {
    const ref: any = notif?.referencia;
    return ref?.producto_id ?? null;
  }

  obtenerFechaInicioReferencia(notif: Notificacion): string | null {
    const ref: any = notif?.referencia;
    return ref?.fecha_inicio ?? null;
  }

  obtenerFechaFinReferencia(notif: Notificacion): string | null {
    const ref: any = notif?.referencia;
    return ref?.fecha_fin ?? null;
  }

  estaAceptandoPresupuesto(presupuestoId: string | number | null): boolean {
    if (presupuestoId == null) return false;
    return this.aceptandoPresupuestoIds().has(String(presupuestoId));
  }

  estaAceptadoPresupuesto(presupuestoId: string | number | null): boolean {
    if (presupuestoId == null) return false;
    return this.aceptadosPresupuestoIds().has(String(presupuestoId));
  }

  private setAceptandoPresupuesto(presupuestoId: string | number, value: boolean) {
    const key = String(presupuestoId);
    this.aceptandoPresupuestoIds.update(prev => {
      const next = new Set(prev);
      if (value) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  }

  private setAceptadoPresupuesto(presupuestoId: string | number) {
    const key = String(presupuestoId);
    this.aceptadosPresupuestoIds.update(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }

  aceptarPresupuestoDesdeNotificacion(notif: Notificacion) {
    this.mensajeAccion.set(null);
    const presupuestoId = this.obtenerPresupuestoId(notif);
    if (presupuestoId == null) {
      this.mensajeAccion.set('No se pudo identificar el presupuesto.');
      return;
    }
    if (this.estaAceptandoPresupuesto(presupuestoId) || this.estaAceptadoPresupuesto(presupuestoId)) {
      return;
    }

    this.setAceptandoPresupuesto(presupuestoId, true);
    this.pedirPresupuestoCtx.aceptarPresupuesto(presupuestoId).subscribe({
      next: (res) => {
        const reservaId =
          res?.reserva_id ??
          res?.reserva?.id ??
          null;

        if (reservaId != null) {
          localStorage.setItem('reserva_id', String(reservaId));
        }

        this.setAceptandoPresupuesto(presupuestoId, false);
        this.setAceptadoPresupuesto(presupuestoId);
        this.mensajeAccion.set(res?.message ?? res?.mensaje ?? 'Presupuesto aceptado. Fecha bloqueada.');

        if (notif?.id) {
          this.notificacionesCtx.marcarLeida(notif.id).subscribe({
            next: () => {
              this.notificaciones.update(prev =>
                prev.map(n => n.id === notif.id ? { ...n, leido: true } : n)
              );
            },
            error: () => { }
          });
        }
      },
      error: (error) => {
        this.setAceptandoPresupuesto(presupuestoId, false);
        const msg =
          error?.error?.message ??
          error?.error?.mensaje ??
          'No se pudo aceptar el presupuesto.';
        this.mensajeAccion.set(msg);
      }
    });
  }

  private iniciarEscuchaNotificaciones() {
    const userId = Number(localStorage.getItem('id'));
    if (!userId) return;

    this.echoSvc.prepare()
      .then(() => {
        this.echoSvc.init();
        this.unsubscribeNotificaciones?.();
        this.unsubscribeNotificaciones = this.echoSvc.subscribeUserNotifications(userId, (data: any) => {
          const nueva = this.mapNotificacionFromEvent(data);
          if (!nueva) {
            this.cargarNotificaciones();
            return;
          }
          const nuevaId = this.obtenerNotificacionId(nueva);
          if (nuevaId == null) return;
          this.notificaciones.update(prev => {
            const existe = prev.some(n => this.obtenerNotificacionId(n) === nuevaId);
            if (existe) return prev;
            return [nueva, ...prev];
          });
        });
      })
      .catch(err => console.error('Error preparando Echo:', err));
  }

  private obtenerNotificacionId(notif: Notificacion): number | string | null {
    return (
      (notif as { id?: number | string }).id ??
      (notif as { id_notificacion?: number | string }).id_notificacion ??
      (notif as { notificacion_id?: number | string }).notificacion_id ??
      null
    );
  }

  private mapNotificacionFromEvent(data: any): Notificacion | null {
    const payload = data?.data ?? data;
    const id =
      payload?.id ??
      payload?.id_notificacion ??
      payload?.notificacion_id ??
      null;

    if (id == null) return null;

    return {
      id,
      tipo: payload?.tipo ?? 'presupuesto',
      titulo: payload?.titulo ?? 'Nueva notificacion',
      mensaje: payload?.mensaje ?? '',
      leido: false,
      referencia_id: payload?.referencia_id ?? null,
      referencia_type: payload?.referencia_type ?? null,
      referencia: payload?.referencia ?? null,
    } as Notificacion;
  }

  ngOnDestroy() {
    this.unsubscribeNotificaciones?.();
    this.unsubscribeNotificaciones = null;
  }



}
