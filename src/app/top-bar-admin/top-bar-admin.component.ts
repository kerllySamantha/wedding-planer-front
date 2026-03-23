import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { AutenticarHttpClientService } from '../Services/Autentication/autenticar-http-client.service';
import { AdminNavProveedorComponent } from '../admin-nav-proveedor/admin-nav-proveedor.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NotificacionesService } from '../Services/Notificacion/notificaciones.service';
import { Notificacion } from '../Interfaces/Notificacion';
import { Paginated } from '../Services/Paginated';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyPipe } from '@angular/common';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EchoService } from '../Services/Echo/echo.service';

@Component({
  selector: 'app-top-bar-admin',
  standalone: true,
  imports: [AdminNavProveedorComponent, MatMenuModule, MatIconModule, MatButtonModule, MatBadgeModule, MatDividerModule, MatProgressSpinnerModule],
  templateUrl: './top-bar-admin.component.html',
  styleUrls: ['./top-bar-admin.component.scss']
})
export class TopBarAdminComponent {


  private authService = inject(AutenticarHttpClientService);
  private svc = inject(NotificacionesService);
  private destroyRef = inject(DestroyRef);
  private echoSvc = inject(EchoService);


  cargando = signal(false);
  paginaActual = signal(1);
  sidebarOpen = signal(false);
  nombreEmpresa = signal<string>('');
  userIde = signal<number>(Number(localStorage.getItem('id')));
  respuesta = signal<Paginated<Notificacion> | null>(null);
  ocultas = signal<Set<number | string>>(new Set());

  notificaciones = computed(() => {
    const ocultas = this.ocultas();
    return (this.respuesta()?.data ?? []).filter(n => {
      const id = this.obtenerNotificacionId(n);
      if (id == null) return false;
      return !this.esLeida(n) && !ocultas.has(id);
    });
  });
  meta = computed(() => this.respuesta()?.meta ?? null);
  links = computed(() => this.respuesta()?.links ?? null);
  noLeidas = computed(() => this.notificaciones().length);
  hayNotificaciones = computed(() => this.noLeidas() > 0);

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.cargarNombreEmpresa();
    this.cargarNotificaciones();
    this.echoSvc.prepare()
      .then(() => {
        this.echoSvc.init();
        this.escucharNotificaciones();
      })
      .catch(err => console.error('Error preparando Echo:', err));
    //   interval(10000)
    //     .pipe(takeUntilDestroyed(this.destroyRef))
    //     .subscribe(() => this.cargarNotificaciones());
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  onHamburgerClick() {
    this.toggleSidebar();
  }

  private cargarNombreEmpresa() {
    const empresa = localStorage.getItem('empresa');
    if (empresa) {
      const empresaObj = JSON.parse(empresa);
      this.nombreEmpresa.set(empresaObj.nombre_empresa || '');
    }
  }

  logout(event?: Event) {
    event?.preventDefault();
    this.authService.logout().subscribe({
      next: () => {
        localStorage.clear();
        this.router.navigate(['/dashboard-empresas'], { replaceUrl: true });
      },
      error: err => console.error('Error al cerrar sesion', err)
    });
  }

  cargarNotificaciones() {
    const userId = this.userIde();
    if (!Number.isFinite(userId)) return;
    if (this.cargando()) return;

    this.cargando.set(true);
    this.svc.getNotificaciones(userId, this.paginaActual()).subscribe({
      next: (res) => {
        this.respuesta.set(res);
        console.log(this.respuesta())
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  cambiarPagina(pagina: number) {
    this.paginaActual.set(pagina);
    this.cargarNotificaciones();
  }

 onClickNotificacion(notif: Notificacion) {
  const eraNoLeida = !this.esLeida(notif);
  const notifId = this.obtenerNotificacionId(notif);
  if (notifId == null) return;

  // Oculta la notificación de la lista
  this.ocultas.update(prev => {
    const next = new Set(prev);
    next.add(notifId);
    return next;
  });

  // Marca como leída en servidor
  if (eraNoLeida) {
    this.svc.marcarLeida(Number(notifId)).subscribe({
      error: () => {
        this.ocultas.update(prev => {
          const next = new Set(prev);
          next.delete(notifId);
          return next;
        });
      }
    });
  }

  // Navega según el tipo
  const ref = notif.referencia as any;
  const referenciaId = ref?.id ?? notif.referencia_id ?? null;

  if (!referenciaId) return;

  setTimeout(() => {
    if (notif.tipo === 'boda_proxima' || notif.tipo === 'tarea_pendiente') {
      this.router.navigateByUrl(`/proveedor-dashboard/bodas/${referenciaId}`);
    } else {
      // presupuesto, presupuesto_pendiente y cualquier otro
      this.router.navigateByUrl(`/proveedor-dashboard/solicitudes/${referenciaId}`);
    }
  }, 150);
}



  private esLeida(notif?: Notificacion | null): boolean {
    if (!notif) return false;
    const valor = (notif as { leido?: boolean | number | string }).leido;
    if (typeof valor === 'boolean') return valor;
    if (typeof valor === 'number') return valor === 1;
    if (typeof valor === 'string') return valor === '1' || valor.toLowerCase() === 'true';
    return false;
  }

  private obtenerSolicitudId(notif: Notificacion): number | string | null {
    const referencia = notif.referencia as { id?: number | string; data?: { id?: number | string } } | null;
    return (
      referencia?.id ??
      referencia?.data?.id ??
      notif.referencia_id ??
      (notif as { solicitud_id?: number | string }).solicitud_id ??
      (notif as { presupuesto_id?: number | string }).presupuesto_id ??
      null
    );
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

  private buildPaginated(data: Notificacion[]): Paginated<Notificacion> {
    return {
      data,
      links: {
        first: null,
        last: null,
        prev: null,
        next: null,
      },
      meta: {
        current_page: 1,
        from: data.length ? 1 : null,
        last_page: 1,
        path: '',
        per_page: 10,
        to: data.length ? data.length : null,
        total: data.length,
      },
    };
  }


  marcarTodasLeidas() {
    const actuales = this.notificaciones();
    actuales.forEach(n => {
      const id = this.obtenerNotificacionId(n);
      if (id != null) {
        this.svc.marcarLeida(Number(id)).subscribe();
      }
    });

    this.ocultas.update(prev => {
      const next = new Set(prev);
      actuales.forEach(n => {
        const id = this.obtenerNotificacionId(n);
        if (id != null) next.add(id);
      });
      return next;
    });
  }


  iconoPorTipo(tipo: string): string {
    const iconos: Record<string, string> = {
      presupuesto: 'request_quote',
      mensaje: 'chat',
      alerta: 'warning',
      presupuesto_pendiente: 'pending_actions',
      boda_proxima: 'event',
      tarea_pendiente: 'task_alt',

    };
    return iconos[tipo] ?? 'notifications';
  }

  private escucharNotificaciones() {
    const userId = this.userIde();
    if (!userId) return;

    this.echoSvc.instance
      .private(`usuario.${userId}`)
      .listen('.nueva-notificacion', (data: any) => {
        console.log('Notificacion en tiempo real:', data);

        const nueva = this.mapNotificacionFromEvent(data);
        if (nueva) {
          const nuevaId = this.obtenerNotificacionId(nueva);
          if (nuevaId != null) {
            this.ocultas.update(prev => {
              const next = new Set(prev);
              next.delete(nuevaId);
              return next;
            });
          }

          this.respuesta.update(r => {
            const id = this.obtenerNotificacionId(nueva);
            if (!r) {
              return this.buildPaginated([nueva]);
            }
            if (!id) return r;
            const existe = r.data.some(n => this.obtenerNotificacionId(n) === id);
            if (existe) return r;
            return { ...r, data: [nueva, ...r.data] };
          });
        } else {
          this.cargarNotificaciones();
        }
      });
  }



}

