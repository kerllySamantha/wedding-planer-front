import { CurrencyPipe, NgTemplateOutlet } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthenticationService } from '../Services/Autentication/authenticationService';
import { NotificacionesService } from '../Services/Notificacion/notificaciones.service';
import { Notificacion } from '../Interfaces/Notificacion';
import { PedirPresupuestoInfo, EstadoPedirPresupuesto } from '../Interfaces/PedirPresupuesto';
import { PedirPresupuestoService } from '../Services/PedirPresupuestos/pedir-presupuesto.service';
import { EchoService } from '../Services/Echo/echo.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink, RouterLinkActive,
    MatSidenavModule, MatCheckboxModule,
    MatButtonModule, MatMenuModule, MatDividerModule,
    NgTemplateOutlet,
    CurrencyPipe,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit, OnDestroy {

  // ── Servicios ─────────────────────────────────────────────────────────────

  readonly autServicectx       = inject(AuthenticationService);
  private readonly notificacionesCtx   = inject(NotificacionesService);
  private readonly pedirPresupuestoCtx = inject(PedirPresupuestoService);
  private readonly echoSvc             = inject(EchoService);
  private readonly router              = inject(Router);

  // ── Estado ────────────────────────────────────────────────────────────────

  readonly nombreU       = signal<string | null>(null);
  readonly rolAuth       = computed(() => !!this.autServicectx.rol());
  readonly toastMessage  = signal<string | null>(null);
  readonly mensajeAccion = signal<string | null>(null);

  readonly notificacionesLoading = signal<boolean>(false);
  readonly notificacionesError   = signal<string | null>(null);

  /** Todas las notificaciones recibidas */
  private readonly _notificaciones = signal<Notificacion[]>([]);

  /** Solo las no leídas — lo que se muestra en el panel */
  readonly notificaciones = computed(() =>
    this._notificaciones().filter(n => !this.esLeida(n))
  );

  readonly notificacionesNoLeidas = computed(() => this.notificaciones().length);

  rutaActiva = '';
  private toastTimer: number | null = null;
  private unsubscribeNotificaciones: (() => void) | null = null;

  // ── Constructor ───────────────────────────────────────────────────────────

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.rutaActiva = event.urlAfterRedirects;
    });
  }

  // ── Ciclo de vida ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.letraNombre();
    this.cargarNotificaciones();
    this.iniciarEscuchaNotificaciones();
  }

  ngOnDestroy(): void {
    this.unsubscribeNotificaciones?.();
    this.unsubscribeNotificaciones = null;
    if (this.toastTimer != null) {
      window.clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

  // ── Navegación ────────────────────────────────────────────────────────────

  esRutaHome(): boolean {
    return this.router.url === '/';
  }

  estaEnRuta(ruta: string): boolean {
    const url = this.router.url;
    if (ruta === 'mi-boda') {
      return url.includes('mi-boda') || url.includes('dashboard-empresas');
    }
    return url.includes(ruta);
  }

  esRutaActiva(ruta: string): boolean {
    return this.rutaActiva.includes(ruta);
  }

  // ── Sesión ────────────────────────────────────────────────────────────────

  letraNombre(): void {
    const inicial = localStorage.getItem('nombre')?.charAt(0) ?? null;
    this.nombreU.set(inicial);
  }

  logout(event?: Event): void {
    event?.preventDefault();
    this.autServicectx.logout().subscribe({
      next: () => this.router.navigate(['']),
      error: (err: HttpErrorResponse) => console.error('Error al cerrar sesión', err),
    });
  }

  // ── Notificaciones ────────────────────────────────────────────────────────

  cargarNotificaciones(): void {
    const usuarioId = Number(localStorage.getItem('id'));
    if (!usuarioId) {
      this._notificaciones.set([]);
      return;
    }
    if (this.notificacionesLoading()) return;

    this.notificacionesLoading.set(true);
    this.notificacionesError.set(null);

    this.notificacionesCtx.getNotificaciones(usuarioId, 1).subscribe({
      next: (res) => {
        this._notificaciones.set(res?.data ?? []);
        this.notificacionesLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.notificacionesError.set(err.error?.message ?? 'No se pudieron cargar las notificaciones.');
        this.notificacionesLoading.set(false);
      },
    });
  }

  irADetalleDesdeNotificacion(notif: Notificacion): void {
    const presupuestoId = this.presupuestoId(notif);
    if (!presupuestoId) return;

    this.marcarLeida(notif);
    this.router.navigate(['/presupuesto', presupuestoId]);
  }

  /** Marca la notificación como leída en servidor y la elimina del panel */
  marcarLeida(notif: Notificacion): void {
    if (!notif?.id || this.esLeida(notif)) return;

    this.notificacionesCtx.marcarLeida(notif.id).subscribe({
      next: () => {
        this._notificaciones.update(prev =>
          prev.map(n => n.id === notif.id ? { ...n, leido: true } : n)
        );
      },
      error: () => { /* silencioso */ },
    });
  }

  // ── Helpers de notificación ───────────────────────────────────────────────

  esLeida(notif?: Notificacion | null): boolean {
    if (!notif) return false;
    const v = notif.leido;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number')  return v === 1;
    // if (typeof v === 'string')  return v === '1' || v.toLowerCase() === 'true';
    return false;
  }

  esNotificacionPresupuesto(notif: Notificacion): boolean {
    const tipo = (notif?.tipo ?? '').toLowerCase();
    if (tipo.includes('presupuesto')) return true;
    const ref = notif?.referencia;
    return !!(ref && (ref.importe_ofertado != null || ref.presupuesto != null));
  }

  presupuestoId(notif: Notificacion): string | number | null {
    return (
      notif?.referencia?.id ??
      notif?.referencia_id ??
      null
    );
  }

  importeOfertado(notif: Notificacion): number | null {
    const importe = notif?.referencia?.importe_ofertado;
    if (importe == null) return null;
    const num = Number(importe);
    return Number.isFinite(num) ? num : null;
  }

  estadoPresupuesto(notif: Notificacion): string {
    const estado = notif?.referencia?.estado;
    if (!estado) return 'pendiente';
    return estado.aceptado_empresa || estado.rechazado_empresa || estado.pendiente || 'pendiente';
  }

  modalidadReferencia(notif: Notificacion): string | null {
    return notif?.referencia?.modalidad ?? null;
  }

  productoReferencia(notif: Notificacion): number | string | null {
    return notif?.referencia?.producto_id ?? null;
  }

  fechaInicioReferencia(notif: Notificacion): string | null {
    return notif?.referencia?.fecha_inicio ?? null;
  }

  fechaFinReferencia(notif: Notificacion): string | null {
    return notif?.referencia?.fecha_fin ?? null;
  }

  // ── Echo (WebSocket) ──────────────────────────────────────────────────────

  private iniciarEscuchaNotificaciones(): void {
    const userId = this.autServicectx.usuario_id();
    if (!userId) return;

    this.echoSvc.prepare()
      .then(() => {
        this.echoSvc.init();
        this.unsubscribeNotificaciones?.();

        this.unsubscribeNotificaciones = this.echoSvc.subscribeUserNotifications(
          userId,
          (data: Record<string, unknown>) => {
            const nueva = this.mapNotificacionFromEvent(data);
            if (!nueva) {
              this.cargarNotificaciones();
              return;
            }
            this._notificaciones.update(prev => {
              const existe = prev.some(n => n.id === nueva.id);
              return existe ? prev : [nueva, ...prev];
            });
            this.mostrarToast(nueva.titulo ?? 'Nueva notificación');
          }
        );
      })
      .catch(err => console.error('Error preparando Echo:', err));
  }

  private mostrarToast(mensaje: string): void {
    this.toastMessage.set(mensaje);
    if (this.toastTimer != null) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toastMessage.set(null);
      this.toastTimer = null;
    }, 4000);
  }

  private mapNotificacionFromEvent(data: Record<string, unknown>): Notificacion | null {
    const payload = (data?.['data'] ?? data) as Record<string, unknown>;
    const id = payload?.['id'] ?? payload?.['id_notificacion'] ?? payload?.['notificacion_id'] ?? null;
    if (id == null) return null;

    return {
      id:              id as number,
      tipo:            (payload?.['tipo']   as string)  ?? 'presupuesto',
      titulo:          (payload?.['titulo'] as string)  ?? 'Nueva notificación',
      mensaje:         (payload?.['mensaje'] as string) ?? '',
      leido:           false,
      referencia_id:   (payload?.['referencia_id']   as number | string | null) ?? null,
      referencia_type: (payload?.['referencia_type'] as string | null) ?? null,
      referencia:      (payload?.['referencia'] as PedirPresupuestoInfo | null) ?? null,
    };
  }
}