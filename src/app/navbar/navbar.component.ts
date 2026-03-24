
import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthenticationService } from '../Services/Autentication/authenticationService';
import { NotificacionesService } from '../Services/Notificacion/notificaciones.service';
import { Notificacion } from '../Interfaces/Notificacion';
import { PedirPresupuestoService } from '../Services/PedirPresupuestos/pedir-presupuesto.service';
import { EchoService } from '../Services/Echo/echo.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, MatSidenavModule, RouterLinkActive,
    MatCheckboxModule, MatButtonModule, MatMenuModule, MatDividerModule, CurrencyPipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {


  autServicectx = inject(AuthenticationService);
  notificacionesCtx = inject(NotificacionesService);
  pedirPresupuestoCtx = inject(PedirPresupuestoService);
  echoSvc = inject(EchoService);
  nombreU = signal<string | null>('');
  rutaActiva: string = '';
  rolAuth = computed(() => !!this.autServicectx.rol());

  notificaciones = signal<Notificacion[]>([]);
  notificacionesLoading = signal(false);
  notificacionesError = signal<string | null>(null);
  mensajeAccion = signal<string | null>(null);
  toastMessage = signal<string | null>(null);
  private toastTimer: number | null = null;

  notificacionesNoLeidas = computed(() =>
    this.notificaciones().filter(n => !this.esLeida(n)).length
  );

  private aceptandoPresupuestoIds = signal<Set<string>>(new Set());
  private aceptadosPresupuestoIds = signal<Set<string>>(new Set());
  private unsubscribeNotificaciones: (() => void) | null = null;


  constructor(private router: Router) {


    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.rutaActiva = event.urlAfterRedirects;
    });
  }




  ngOnInit() {
    this.letraNombre();

    console.log(this.rolAuth());

    this.autServicectx.rol()
    this.cargarNotificaciones();
    this.iniciarEscuchaNotificaciones();
  }

  esRutaHome(): boolean {
    return this.router.url === '/';
  }

  estaEnRuta(ruta: string): boolean {
    const urlActual = this.router.url;
    if (ruta === 'mi-boda') {
      return urlActual.includes('mi-boda') || urlActual.includes('dashboard-empresas');
    }
    return urlActual.includes(ruta);
  }


  esRutaActiva(ruta: string): boolean {

    return this.rutaActiva.includes(ruta);
  }


  letraNombre() {
    const nameU = localStorage.getItem('nombre')?.charAt(0)
    this.nombreU.set(nameU || null);

  }
  logout(event?: Event): void {
    event?.preventDefault();
    this.autServicectx.logout().subscribe({
      next: () => {
        console.log('Sesión cerrada correctamente');
        this.router.navigate(['']);
      },
      error: err => console.error('Error al cerrar sesión', err)
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

  esLeida(notif?: Notificacion | null): boolean {
    if (!notif) return false;
    const valor = (notif as { leido?: boolean | number | string }).leido;
    if (typeof valor === 'boolean') return valor;
    if (typeof valor === 'number') return valor === 1;
    if (typeof valor === 'string') return valor === '1' || valor.toLowerCase() === 'true';
    return false;
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
    const userId = this.autServicectx.usuario_id();
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
          this.mostrarToast(nueva.titulo ?? 'Nueva notificacion');
        });
      })
      .catch(err => console.error('Error preparando Echo:', err));
  }

  private mostrarToast(mensaje: string) {
    this.toastMessage.set(mensaje);
    if (this.toastTimer != null) {
      window.clearTimeout(this.toastTimer);
    }
    this.toastTimer = window.setTimeout(() => {
      this.toastMessage.set(null);
      this.toastTimer = null;
    }, 4000);
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
    if (this.toastTimer != null) {
      window.clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

}

