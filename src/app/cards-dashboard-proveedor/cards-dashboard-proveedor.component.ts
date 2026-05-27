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

const TOP_COLORS = [C.dark, C.mid, C.base, C.soft, C.pale];

const SOL_COLORS = {
  pendiente: C.soft,
  aceptada:  C.dark,
  rechazada: C.pale,
};

const toAlpha = (hex: string, a = 'cc') => hex + a;

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

  @ViewChild('topCanvas')         topCanvas!:         ElementRef<HTMLCanvasElement>;
  @ViewChild('catalogoCanvas')    catalogoCanvas!:    ElementRef<HTMLCanvasElement>;
  @ViewChild('solicitudesCanvas') solicitudesCanvas!: ElementRef<HTMLCanvasElement>;

  private topChart:         Chart | null = null;
  private catalogoChart:    Chart | null = null;
  private solicitudesChart: Chart | null = null;

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
  totalResenias    = computed(() => this.estadisticas()?.totalResenias  ?? 0);
  totalProductos   = computed(() => this.estadisticas()?.totalProductos ?? 0);
  totalReservas    = computed(() => this.estadisticas()?.totalReservas  ?? 0);
  totalSolicitudes = computed(() => this.solicitudesItems().length);

  // Reservas del mes seleccionado
  reservasMes         = computed(() => this.reservas().filter(r => isSameMonth(parseISO(r.fecha_inicio), this.selectedDate())));
  reservasCompletadas = computed(() => this.reservasMes().filter(r => r.estado === 'confirmada'));
  reservasPendientes  = computed(() => this.reservasMes().filter(r => r.estado === 'pendiente'));
  reservasCanceladas  = computed(() => this.reservasMes().filter(r => r.estado === 'cancelada'));
  reservasBloqueadas  = computed(() => this.reservasMes().filter(r => r.estado === 'bloqueada'));
  reservasRechazadas  = computed(() => this.reservasMes().filter(r => r.estado === 'rechazada'));

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
      const items = this.solicitudesItems();
      if (this.solicitudesChart) this.aplicarSolicitudes(items);
    });
  }

  ngOnInit(): void {
    this.cargarReservas();
    this.cargarEstadisticas();
    this.cargarProductosCatalogo();
    this.cargarSolicitudes();
  }

  ngAfterViewInit(): void {
    this.initTop();
    this.initCatalogo();
    this.initSolicitudes();

    const stats = this.estadisticas();
    if (stats) this.aplicarStats(stats);
    const prods = this.productosCatalogo();
    if (prods.length) this.aplicarCatalogo(prods);
    this.aplicarSolicitudes(this.solicitudesItems());
  }

  ngOnDestroy(): void {
    this.topChart?.destroy();
    this.catalogoChart?.destroy();
    this.solicitudesChart?.destroy();
  }

  // ── Inicialización ────────────────────────────────────────────────────────
  private initTop(): void {
    this.topChart = new Chart(this.topCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{ data: [], backgroundColor: [], borderRadius: 8, borderSkipped: false }],
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
          x: {
            beginAtZero: true,
            ticks: { color: 'rgba(20,63,102,0.6)', font: { size: 11 }, stepSize: 1 },
            grid: { color: 'rgba(47,93,134,0.07)' },
            border: { display: false },
          },
          y: {
            ticks: {
              color: C.dark,
              font: { size: 11, weight: 600 },
              callback: (_, i, ticks) => {
                const l = (ticks[i] as any)?.label ?? '';
                return typeof l === 'string' && l.length > 22 ? l.slice(0, 22) + '…' : l;
              },
            },
            grid: { display: false },
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

  private initSolicitudes(): void {
    const centerPlugin = {
      id: 'solicitudesCenter',
      afterDatasetsDraw: (chart: Chart) => {
        const { ctx, data, chartArea } = chart;
        if (!chartArea) return;
        const total = (data.datasets[0].data as number[]).reduce((a: number, b) => a + (b as number), 0);
        if (!total) return;
        const cx = chartArea.left + chartArea.width  / 2;
        const cy = chartArea.top  + chartArea.height / 2;
        const r  = Math.min(chartArea.width, chartArea.height);
        ctx.save();
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.font         = `800 ${r * 0.19}px sans-serif`;
        ctx.fillStyle    = C.dark;
        ctx.fillText(String(total), cx, cy - r * 0.05);
        ctx.font         = `500 ${r * 0.09}px sans-serif`;
        ctx.fillStyle    = 'rgba(20,63,102,0.5)';
        ctx.fillText('solicitudes', cx, cy + r * 0.11);
        ctx.restore();
      },
    };

    this.solicitudesChart = new Chart(this.solicitudesCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Pendientes', 'Aceptadas', 'Rechazadas'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: [
            toAlpha(SOL_COLORS.pendiente),
            toAlpha(SOL_COLORS.aceptada),
            toAlpha(SOL_COLORS.rechazada),
          ],
          borderWidth: 4,
          borderColor: 'rgba(255,255,255,0.9)',
          hoverOffset: 10,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.3,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 11, weight: 600 },
              color: C.dark,
              padding: 14,
              usePointStyle: true,
              pointStyleWidth: 10,
            },
          },
          tooltip: { ...TOOLTIP_BASE, callbacks: { label: ctx => ` ${ctx.parsed} solicitudes` } },
        },
      },
      plugins: [centerPlugin as any],
    });
  }

  // ── Aplicar datos ─────────────────────────────────────────────────────────
  private aplicarStats(stats: EstadisticasEmpresa['data']): void {
    if (this.topChart) {
      const p = stats.topProductos ?? [];
      this.topChart.data.labels                                     = p.map(x => x.nombre ?? '');
      this.topChart.data.datasets[0].data                           = p.map(x => x.total);
      (this.topChart.data.datasets[0] as any).backgroundColor       = p.map((_, i) => toAlpha(TOP_COLORS[i] ?? C.pale));
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

  private aplicarSolicitudes(items: any[]): void {
    if (!this.solicitudesChart) return;
    const pendientes = items.filter(s => ['pendiente', 'pendiente_usuario'].includes(s.estado ?? '')).length;
    const aceptadas  = items.filter(s => s.estado === 'aceptado_usuario').length;
    const rechazadas = items.filter(s => ['rechazado_empresa', 'rechazado_usuario'].includes(s.estado ?? '')).length;
    this.solicitudesChart.data.datasets[0].data = [pendientes, aceptadas, rechazadas];
    this.solicitudesChart.update();
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
