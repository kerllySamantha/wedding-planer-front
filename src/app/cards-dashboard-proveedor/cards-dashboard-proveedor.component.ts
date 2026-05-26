import {
  Component, computed, effect, ElementRef,
  AfterViewInit, OnDestroy, OnInit,
  inject, signal, ViewChild, CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import {
  Chart,
  ArcElement, DoughnutController,
  BarElement, BarController,
  LineElement, LineController, PointElement, Filler,
  CategoryScale, LinearScale, Legend, Tooltip
} from 'chart.js';

Chart.register(
  ArcElement, DoughnutController,
  BarElement, BarController,
  LineElement, LineController, PointElement, Filler,
  CategoryScale, LinearScale, Legend, Tooltip
);

import { ReservasServiceServiceService } from '../Services/Reservas/reservas-service-service.service';
import { Reserva } from '../Interfaces/Reserva';
import { EmpresasApiServiceService } from '../Services/Empresas/empresas-api-service.service';
import { EstadisticasEmpresa } from '../Interfaces/Empresa';
import { DatePipe, registerLocaleData, TitleCasePipe } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { register } from 'swiper/element/bundle';
register();

import { isSameMonth, parseISO, eachMonthOfInterval, startOfYear, endOfYear } from 'date-fns';
import { Navigation, Thumbs, FreeMode } from 'swiper/modules';
import { cilChevronLeft, cilChevronRight, cilListNumbered, cilPaperPlane } from '@coreui/icons';
import { IconDirective, IconModule, IconSetService } from '@coreui/icons-angular';
import SwiperCore from 'swiper';
import { CardInfoAdminComponent } from '../card-info-admin/card-info-admin.component';

registerLocaleData(localeEs);
SwiperCore.use([Navigation, Thumbs, FreeMode]);

// ── Paleta 100 % azul ──────────────────────────────────────────────────────
const C = {
  navy:     '#0f2233',
  dark:     '#143f66',
  mid:      '#2f5d86',
  base:     '#4a7ba5',
  soft:     '#6f9dbf',
  pale:     '#95bdd8',
  lightest: '#bbd5e8',
};

const ESTADO_COLORS: Record<string, string> = {
  confirmada: C.dark,
  pendiente:  C.mid,
  cancelada:  C.base,
  bloqueada:  C.soft,
  rechazada:  C.pale,
};

const TOP_COLORS  = [C.dark, C.mid, C.base, C.soft, C.pale];
const STAR_COLORS = [C.lightest, C.pale, C.soft, C.mid, C.dark]; // 1★→5★

const TOOLTIP_BASE = {
  backgroundColor: 'rgba(15,34,58,0.92)',
  titleColor:      '#e2eaf2',
  bodyColor:       'rgba(226,234,242,0.85)',
  cornerRadius:    10,
  padding:         10,
};

// ──────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-cards-dashboard-proveedor',
  standalone: true,
  imports: [CardInfoAdminComponent, DatePipe, TitleCasePipe, IconModule, IconDirective],
  providers: [IconSetService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './cards-dashboard-proveedor.component.html',
  styleUrl:    './cards-dashboard-proveedor.component.scss',
})
export class CardsDashboardProveedorComponent implements OnInit, AfterViewInit, OnDestroy {

  private reservasCtx  = inject(ReservasServiceServiceService);
  private empresasCtx  = inject(EmpresasApiServiceService);
  private iconSet      = inject(IconSetService);

  @ViewChild('swiperRef')          swiperRef!:          ElementRef;
  @ViewChild('tendenciaCanvas')    tendenciaCanvas!:    ElementRef<HTMLCanvasElement>;
  @ViewChild('estadoCanvas')       estadoCanvas!:       ElementRef<HTMLCanvasElement>;
  @ViewChild('topCanvas')          topCanvas!:          ElementRef<HTMLCanvasElement>;
  @ViewChild('valoracionesCanvas') valoracionesCanvas!: ElementRef<HTMLCanvasElement>;

  private tendenciaChart:    Chart | null = null;
  private estadoChart:       Chart | null = null;
  private topChart:          Chart | null = null;
  private valoracionesChart: Chart | null = null;

  // ── Signals ──────────────────────────────────────────────────────────────
  estadisticas = signal<EstadisticasEmpresa['data'] | null>(null);
  reservas     = signal<Reserva[]>([]);
  selectedDate = signal<Date>(new Date());
  error        = signal<string | null>(null);
  loading      = signal(true);

  year  = new Date().getFullYear();
  meses = eachMonthOfInterval({
    start: startOfYear(new Date(this.year, 0, 1)),
    end:   endOfYear(new Date(this.year, 11, 31)),
  });

  idEmpresa = computed(() => localStorage.getItem('idEmpresa')!);

  // KPI
  mediaValoracion = computed(() => (this.estadisticas()?.mediaValoracion ?? 0).toFixed(1));
  totalResenias   = computed(() => this.estadisticas()?.totalResenias  ?? 0);
  totalProductos  = computed(() => this.estadisticas()?.totalProductos ?? 0);
  totalReservas   = computed(() => this.estadisticas()?.totalReservas  ?? 0);

  // Reservas filtradas por mes
  reservasMes         = computed(() => this.reservas().filter(r => isSameMonth(parseISO(r.fecha_inicio), this.selectedDate())));
  reservasCompletadas = computed(() => this.reservasMes().filter(r => r.estado === 'confirmada'));
  reservasPendientes  = computed(() => this.reservasMes().filter(r => r.estado === 'pendiente'));
  reservasCanceladas  = computed(() => this.reservasMes().filter(r => r.estado === 'cancelada'));
  reservasBloqueadas  = computed(() => this.reservasMes().filter(r => r.estado === 'bloqueada'));
  reservasRechazadas  = computed(() => this.reservasMes().filter(r => r.estado === 'rechazada'));

  constructor() {
    this.iconSet.icons = { cilListNumbered, cilPaperPlane, cilChevronRight, cilChevronLeft };

    // Actualiza línea de tendencia al cargar reservas
    effect(() => {
      const _r = this.reservas();
      if (this.tendenciaChart) {
        this.tendenciaChart.data.datasets[0].data = this.datosTendencia();
        this.tendenciaChart.update();
      }
    });

    // Actualiza las 3 gráficas de estadísticas cuando llegan del API
    effect(() => {
      const stats = this.estadisticas();
      if (stats) this.aplicarStats(stats);
    });
  }

  ngOnInit(): void {
    this.cargarReservas();
    this.cargarEstadisticas();
  }

  ngAfterViewInit(): void {
    this.initTendencia();
    this.initEstado();
    this.initTop();
    this.initValoraciones();

    // Por si las estadísticas llegaron antes de que los canvas existiesen
    const stats = this.estadisticas();
    if (stats) this.aplicarStats(stats);
  }

  ngOnDestroy(): void {
    this.tendenciaChart?.destroy();
    this.estadoChart?.destroy();
    this.topChart?.destroy();
    this.valoracionesChart?.destroy();
  }

  // ── Datos ─────────────────────────────────────────────────────────────────
  datosTendencia(): number[] {
    return this.meses.map(m => this.reservas().filter(r => isSameMonth(parseISO(r.fecha_inicio), m)).length);
  }

  private aplicarStats(stats: EstadisticasEmpresa['data']): void {
    // Donut: estado
    if (this.estadoChart) {
      const e = stats.reservasPorEstado;
      this.estadoChart.data.labels                                   = e.map(x => x.estado);
      this.estadoChart.data.datasets[0].data                         = e.map(x => x.total);
      (this.estadoChart.data.datasets[0] as any).backgroundColor     = e.map(x => ESTADO_COLORS[x.estado] ?? C.mid);
      this.estadoChart.update();
    }

    // Horizontal bar: top productos
    if (this.topChart) {
      const p = stats.topProductos;
      this.topChart.data.labels                                       = p.map(x => x.nombre);
      this.topChart.data.datasets[0].data                             = p.map(x => x.total);
      (this.topChart.data.datasets[0] as any).backgroundColor         = p.map((_, i) => TOP_COLORS[i] ?? C.pale);
      this.topChart.update();
    }

    // Horizontal bar: valoraciones
    if (this.valoracionesChart) {
      this.valoracionesChart.data.datasets[0].data                    = stats.distribucionValoraciones.map(x => x.total);
      this.valoracionesChart.update();
    }
  }

  // ── Inicialización de gráficas ────────────────────────────────────────────
  private initTendencia(): void {
    const ctx  = this.tendenciaCanvas.nativeElement;
    const grad = ctx.getContext('2d')!.createLinearGradient(0, 0, 0, 220);
    grad.addColorStop(0, 'rgba(47,93,134,0.35)');
    grad.addColorStop(1, 'rgba(47,93,134,0.02)');

    this.tendenciaChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.meses.map(m => new Intl.DateTimeFormat('es', { month: 'short' }).format(m)),
        datasets: [{
          label: 'Reservas',
          data: this.datosTendencia(),
          borderColor:          C.mid,
          backgroundColor:      grad,
          borderWidth:          2.5,
          pointBackgroundColor: C.mid,
          pointBorderColor:     '#fff',
          pointBorderWidth:     2,
          pointRadius:          4,
          pointHoverRadius:     6,
          fill:                 true,
          tension:              0.4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { ...TOOLTIP_BASE, callbacks: { label: ctx => ` ${ctx.parsed.y} reservas` } },
        },
        scales: {
          y: { beginAtZero: true, ticks: { color: 'rgba(20,63,102,0.6)', font: { size: 11 }, stepSize: 1 }, grid: { color: 'rgba(47,93,134,0.08)' }, border: { display: false } },
          x: { ticks: { color: 'rgba(20,63,102,0.6)', font: { size: 11 } }, grid: { display: false }, border: { display: false } },
        },
      },
    });
  }

  private initEstado(): void {
    this.estadoChart = new Chart(this.estadoCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{ data: [], backgroundColor: [], borderWidth: 3, borderColor: 'rgba(255,255,255,0.55)', hoverOffset: 8 }],
      },
      options: {
        responsive: false,
        cutout: '70%',
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 }, color: C.dark, padding: 10, usePointStyle: true, pointStyleWidth: 9 } },
          tooltip: { ...TOOLTIP_BASE, callbacks: { label: ctx => ` ${ctx.parsed} reservas` } },
        },
      },
    });
  }

  private initTop(): void {
    this.topChart = new Chart(this.topCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{ data: [], backgroundColor: [], borderRadius: 6, borderSkipped: false }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { ...TOOLTIP_BASE, callbacks: { label: ctx => ` ${ctx.parsed.x} reservas` } },
        },
        scales: {
          x: { beginAtZero: true, ticks: { color: 'rgba(20,63,102,0.6)', font: { size: 11 }, stepSize: 1 }, grid: { color: 'rgba(47,93,134,0.07)' }, border: { display: false } },
          y: {
            ticks: {
              color: C.dark,
              font:  { size: 11, weight: 600 },
              callback: (_, i, ticks) => {
                const l = (ticks[i] as any)?.label ?? '';
                return typeof l === 'string' && l.length > 22 ? l.slice(0, 22) + '…' : l;
              },
            },
            grid: { display: false }, border: { display: false },
          },
        },
      },
    });
  }

  private initValoraciones(): void {
    this.valoracionesChart = new Chart(this.valoracionesCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: ['1 ★', '2 ★', '3 ★', '4 ★', '5 ★'],
        datasets: [{ data: [0, 0, 0, 0, 0], backgroundColor: STAR_COLORS, borderRadius: 6, borderSkipped: false }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { ...TOOLTIP_BASE, callbacks: { label: ctx => ` ${ctx.parsed.x} reseñas` } },
        },
        scales: {
          x: { beginAtZero: true, ticks: { color: 'rgba(20,63,102,0.6)', font: { size: 11 }, stepSize: 1 }, grid: { color: 'rgba(47,93,134,0.07)' }, border: { display: false } },
          y: { ticks: { color: C.dark, font: { size: 12, weight: 700 } }, grid: { display: false }, border: { display: false } },
        },
      },
    });
  }

  // ── Carga de datos ────────────────────────────────────────────────────────
  cargarReservas(): void {
    this.loading.set(true);
    this.error.set(null);
    this.reservasCtx.getReservaEmpresa(this.idEmpresa()).subscribe({
      next:  resp => { this.reservas.set(resp?.data ?? []); this.loading.set(false); },
      error: ()   => { this.error.set('No se pudieron cargar las reservas'); this.loading.set(false); },
    });
  }

  cargarEstadisticas(): void {
    const id = Number(this.idEmpresa());
    if (!id) return;
    this.empresasCtx.getEstadisticasEmpresa(id).subscribe({
      next:  res => this.estadisticas.set(res.data),
      error: ()  => {},
    });
  }

  // ── Navegación de mes ─────────────────────────────────────────────────────
  prevMonth(): void { const c = this.selectedDate(); this.selectedDate.set(new Date(c.getFullYear(), c.getMonth() - 1, 1)); }
  nextMonth(): void { const c = this.selectedDate(); this.selectedDate.set(new Date(c.getFullYear(), c.getMonth() + 1, 1)); }
  cambiarMes(date: Date): void { this.selectedDate.set(date); }

  reservasMesPorFecha(date: Date): Reserva[] {
    return this.reservas().filter(r => isSameMonth(parseISO(r.fecha_inicio), date));
  }
}
