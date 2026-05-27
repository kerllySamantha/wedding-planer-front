import {
  Component, computed, effect, ElementRef,
  AfterViewInit, OnDestroy, OnInit,
  inject, signal, ViewChild, CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import {
  Chart,
  BarElement, BarController,
  LineElement, LineController, PointElement, Filler,
  CategoryScale, LinearScale, Legend, Tooltip
} from 'chart.js';

Chart.register(
  BarElement, BarController,
  LineElement, LineController, PointElement, Filler,
  CategoryScale, LinearScale, Legend, Tooltip
);

import { ReservasServiceServiceService } from '../Services/Reservas/reservas-service-service.service';
import { Reserva } from '../Interfaces/Reserva';
import { EmpresasApiServiceService } from '../Services/Empresas/empresas-api-service.service';
import { EstadisticasEmpresa } from '../Interfaces/Empresa';
import { PedirPresupuestoApiService } from '../Services/PedirPresupuestos/pedir-presupuesto-api.service';
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

// ── Paleta azul de la app ──────────────────────────────────────────────────
const C = {
  navy:     '#0f2233',
  dark:     '#143f66',
  mid:      '#2f5d86',
  base:     '#4a7ba5',
  soft:     '#6f9dbf',
  pale:     '#95bdd8',
  lightest: '#bbd5e8',
};

const TOP_COLORS  = [C.dark, C.mid, C.base, C.soft, C.pale];
const toAlpha     = (hex: string, a = 'cc') => hex + a;
const MONTH_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

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

  private reservasCtx     = inject(ReservasServiceServiceService);
  private empresasCtx     = inject(EmpresasApiServiceService);
  private presupuestosCtx = inject(PedirPresupuestoApiService);
  private iconSet         = inject(IconSetService);

  @ViewChild('tendenciaCanvas') tendenciaCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topCanvas')       topCanvas!:       ElementRef<HTMLCanvasElement>;
  @ViewChild('catalogoCanvas')  catalogoCanvas!:  ElementRef<HTMLCanvasElement>;

  private tendenciaChart: Chart | null = null;
  private topChart:       Chart | null = null;
  private catalogoChart:  Chart | null = null;

  // ── Signals ──────────────────────────────────────────────────────────────
  estadisticas      = signal<EstadisticasEmpresa['data'] | null>(null);
  reservas          = signal<Reserva[]>([]);
  productosCatalogo = signal<any[]>([]);
  solicitudesItems  = signal<any[]>([]);
  selectedDate      = signal<Date>(new Date());
  error             = signal<string | null>(null);
  loading           = signal(true);

  year  = new Date().getFullYear();
  meses = eachMonthOfInterval({
    start: startOfYear(new Date(this.year, 0, 1)),
    end:   endOfYear(new Date(this.year, 11, 31)),
  });

  idEmpresa = computed(() => localStorage.getItem('idEmpresa')!);

  // KPI
  mediaValoracion  = computed(() => (this.estadisticas()?.mediaValoracion ?? 0).toFixed(1));
  totalProductos   = computed(() => this.estadisticas()?.totalProductos ?? 0);
  totalReservas    = computed(() => this.estadisticas()?.totalReservas  ?? 0);
  totalSolicitudes = computed(() => this.solicitudesItems().length);

  // Solicitudes desglosadas (para tarjetas)
  solicitudesPendientes = computed(() =>
    this.solicitudesItems().filter(s => ['pendiente', 'pendiente_usuario'].includes(s.estado ?? '')).length
  );
  solicitudesAceptadas = computed(() =>
    this.solicitudesItems().filter(s => s.estado === 'aceptado_usuario').length
  );
  solicitudesRechazadas = computed(() =>
    this.solicitudesItems().filter(s => ['rechazado_empresa', 'rechazado_usuario'].includes(s.estado ?? '')).length
  );

  // Reservas del mes seleccionado
  reservasMes         = computed(() => this.reservas().filter(r => isSameMonth(parseISO(r.fecha_inicio), this.selectedDate())));
  reservasCompletadas = computed(() => this.reservasMes().filter(r => r.estado === 'confirmada'));
  reservasPendientes  = computed(() => this.reservasMes().filter(r => r.estado === 'pendiente'));
  reservasCanceladas  = computed(() => this.reservasMes().filter(r => r.estado === 'cancelada'));
  reservasBloqueadas  = computed(() => this.reservasMes().filter(r => r.estado === 'bloqueada'));
  reservasRechazadas  = computed(() => this.reservasMes().filter(r => r.estado === 'rechazada'));

  // Datos mensuales para la gráfica de tendencia anual
  reservasMensuales = computed(() => {
    const all = this.reservas();
    return this.meses.map(m => ({
      total:       all.filter(r => isSameMonth(parseISO(r.fecha_inicio), m)).length,
      confirmadas: all.filter(r => r.estado === 'confirmada' && isSameMonth(parseISO(r.fecha_inicio), m)).length,
    }));
  });

  // Altura dinámica del gráfico de catálogo
  catalogoChartHeight = computed(() => Math.max(220, this.productosCatalogo().length * 54 + 40));

  constructor() {
    this.iconSet.icons = { cilListNumbered, cilPaperPlane, cilChevronRight, cilChevronLeft };

    effect(() => {
      const stats = this.estadisticas();
      if (stats) this.aplicarStats(stats);
    });

    effect(() => {
      const prods = this.productosCatalogo();
      if (this.catalogoChart && prods.length) this.aplicarCatalogo(prods);
    });

    effect(() => {
      const data = this.reservasMensuales();
      if (this.tendenciaChart) this.aplicarTendencia(data);
    });
  }

  ngOnInit(): void {
    this.cargarReservas();
    this.cargarEstadisticas();
    this.cargarProductosCatalogo();
    this.cargarSolicitudes();
  }

  ngAfterViewInit(): void {
    this.initTendencia();
    this.initTop();
    this.initCatalogo();

    const stats = this.estadisticas();
    if (stats) this.aplicarStats(stats);
    const prods = this.productosCatalogo();
    if (prods.length) this.aplicarCatalogo(prods);
    this.aplicarTendencia(this.reservasMensuales());
  }

  ngOnDestroy(): void {
    this.tendenciaChart?.destroy();
    this.topChart?.destroy();
    this.catalogoChart?.destroy();
  }

  // ── Inicialización de gráficas ────────────────────────────────────────────

  private initTendencia(): void {
    this.tendenciaChart = new Chart(this.tendenciaCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: MONTH_LABELS,
        datasets: [
          {
            label: 'Total reservas',
            data: Array(12).fill(0),
            borderColor: C.base,
            backgroundColor: toAlpha(C.pale, '28'),
            tension: 0.42,
            fill: true,
            pointBackgroundColor: C.base,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
          {
            label: 'Confirmadas',
            data: Array(12).fill(0),
            borderColor: C.dark,
            backgroundColor: 'transparent',
            tension: 0.42,
            fill: false,
            pointBackgroundColor: C.dark,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            borderDash: [5, 3],
          } as any,
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              font: { size: 11, weight: 600 },
              color: C.dark,
              usePointStyle: true,
              pointStyleWidth: 10,
              padding: 16,
            },
          },
          tooltip: { ...TOOLTIP_BASE },
        },
        scales: {
          x: {
            ticks: { color: 'rgba(20,63,102,0.65)', font: { size: 11 } },
            grid: { color: 'rgba(47,93,134,0.07)' },
            border: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: { color: 'rgba(20,63,102,0.6)', font: { size: 11 }, stepSize: 1 },
            grid: { color: 'rgba(47,93,134,0.07)' },
            border: { display: false },
          },
        },
      },
    });
  }

  private initTop(): void {
    this.topChart = new Chart(this.topCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderRadius: 8,
          borderSkipped: false,
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
          x: {
            ticks: {
              color: C.dark,
              font: { size: 10, weight: 600 },
              maxRotation: 30,
              callback: (_, i, ticks) => {
                const l = (ticks[i] as any)?.label ?? '';
                return typeof l === 'string' && l.length > 13 ? l.slice(0, 13) + '…' : l;
              },
            },
            grid: { display: false },
            border: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: { color: 'rgba(20,63,102,0.6)', font: { size: 11 }, stepSize: 1 },
            grid: { color: 'rgba(47,93,134,0.07)' },
            border: { display: false },
          },
        },
      },
    });
  }

  private initCatalogo(): void {
    this.catalogoChart = new Chart(this.catalogoCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Rango de precio',
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...TOOLTIP_BASE,
            callbacks: {
              title: ctx => ctx[0]?.label ?? '',
              label: ctx => {
                const d = ctx.dataset.data[ctx.dataIndex] as unknown as [number, number];
                return Array.isArray(d) ? ` ${d[0]}€ — ${d[1]}€` : '';
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Precio (€)',
              color: 'rgba(20,63,102,0.5)',
              font: { size: 10 },
            },
            ticks: {
              color: 'rgba(20,63,102,0.6)',
              font: { size: 10 },
              callback: v => `${v}€`,
            },
            grid: { color: 'rgba(47,93,134,0.07)' },
            border: { display: false },
          },
          y: {
            ticks: {
              color: C.dark,
              font: { size: 11, weight: 600 },
              callback: (_, i, ticks) => {
                const l = (ticks[i] as any)?.label ?? '';
                return typeof l === 'string' && l.length > 28 ? l.slice(0, 28) + '…' : l;
              },
            },
            grid: { display: false },
            border: { display: false },
          },
        },
      },
    });
  }

  // ── Aplicar datos ─────────────────────────────────────────────────────────

  private aplicarStats(stats: EstadisticasEmpresa['data']): void {
    if (this.topChart) {
      const p = stats.topProductos ?? [];
      this.topChart.data.labels                               = p.map(x => x.nombre ?? '');
      this.topChart.data.datasets[0].data                     = p.map(x => x.total);
      (this.topChart.data.datasets[0] as any).backgroundColor = p.map((_, i) => toAlpha(TOP_COLORS[i] ?? C.pale));
      this.topChart.update();
    }
  }

  private aplicarCatalogo(productos: any[]): void {
    if (!this.catalogoChart) return;
    this.catalogoChart.data.labels = productos.map(p => p.nombre ?? '');
    this.catalogoChart.data.datasets[0].data = productos.map(p => {
      const min = +(p.precio_min ?? 0);
      const max = +(p.precio_max ?? 0);
      return [min, Math.max(max, min + 1)] as any;
    });
    (this.catalogoChart.data.datasets[0] as any).backgroundColor = productos.map((_, i) => toAlpha(TOP_COLORS[i % TOP_COLORS.length], 'bb'));
    (this.catalogoChart.data.datasets[0] as any).borderColor     = productos.map((_, i) => TOP_COLORS[i % TOP_COLORS.length]);
    this.catalogoChart.update();
  }

  private aplicarTendencia(data: { total: number; confirmadas: number }[]): void {
    if (!this.tendenciaChart) return;
    this.tendenciaChart.data.datasets[0].data = data.map(d => d.total);
    this.tendenciaChart.data.datasets[1].data = data.map(d => d.confirmadas);
    this.tendenciaChart.update();
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

  cargarProductosCatalogo(): void {
    const id = Number(this.idEmpresa());
    if (!id) return;
    this.empresasCtx.getEmpresaProductos(id).subscribe({
      next: resp => {
        const data = (resp as any)?.data ?? resp ?? [];
        this.productosCatalogo.set(Array.isArray(data) ? data : []);
      },
      error: () => {},
    });
  }

  cargarSolicitudes(): void {
    const id = this.idEmpresa();
    if (!id) return;
    this.presupuestosCtx.getEmpresaPedirPresupuesto(id).subscribe({
      next:  resp => this.solicitudesItems.set(resp ?? []),
      error: ()   => {},
    });
  }

  // ── Navegación ────────────────────────────────────────────────────────────
  prevMonth(): void { const c = this.selectedDate(); this.selectedDate.set(new Date(c.getFullYear(), c.getMonth() - 1, 1)); }
  nextMonth(): void { const c = this.selectedDate(); this.selectedDate.set(new Date(c.getFullYear(), c.getMonth() + 1, 1)); }
  cambiarMes(date: Date): void { this.selectedDate.set(date); }

  reservasMesPorFecha(date: Date): Reserva[] {
    return this.reservas().filter(r => isSameMonth(parseISO(r.fecha_inicio), date));
  }
}
