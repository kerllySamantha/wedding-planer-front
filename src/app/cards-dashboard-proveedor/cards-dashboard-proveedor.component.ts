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
import { DatePipe, DecimalPipe, registerLocaleData, TitleCasePipe } from '@angular/common';
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

const C = {
  navy:     '#0f2233',
  dark:     '#143f66',
  mid:      '#2f5d86',
  base:     '#4a7ba5',
  soft:     '#6f9dbf',
  pale:     '#95bdd8',
  lightest: '#bbd5e8',
};

const TOP_COLORS   = [C.dark, C.mid, C.base, C.soft, C.pale];
const toAlpha      = (hex: string, a = 'cc') => hex + a;
const MONTH_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const TOOLTIP_BASE = {
  backgroundColor: 'rgba(15,34,58,0.92)',
  titleColor:      '#e2eaf2',
  bodyColor:       'rgba(226,234,242,0.85)',
  cornerRadius:    10,
  padding:         10,
};

@Component({
  selector: 'app-cards-dashboard-proveedor',
  standalone: true,
  imports: [CardInfoAdminComponent, DatePipe, DecimalPipe, TitleCasePipe, IconModule, IconDirective],
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

  private tendenciaChart: Chart | null = null;

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

  // Top productos para leaderboard
  topProductos = computed(() => this.estadisticas()?.topProductos ?? []);
  maxTop       = computed(() => Math.max(1, ...this.topProductos().map(p => p.total)));

  // Solicitudes desglosadas + porcentajes
  solicitudesPendientes = computed(() =>
    this.solicitudesItems().filter(s => ['pendiente', 'pendiente_usuario'].includes(s.estado ?? '')).length
  );
  solicitudesAceptadas = computed(() =>
    this.solicitudesItems().filter(s => s.estado === 'aceptado_usuario').length
  );
  solicitudesRechazadas = computed(() =>
    this.solicitudesItems().filter(s => ['rechazado_empresa', 'rechazado_usuario'].includes(s.estado ?? '')).length
  );
  solicitudesPct = computed(() => {
    const t = this.totalSolicitudes();
    if (!t) return { pend: '—', acep: '—', rech: '—' };
    return {
      pend: Math.round(this.solicitudesPendientes() / t * 100) + '%',
      acep: Math.round(this.solicitudesAceptadas()  / t * 100) + '%',
      rech: Math.round(this.solicitudesRechazadas() / t * 100) + '%',
    };
  });

  // Reservas del mes seleccionado
  reservasMes         = computed(() => this.reservas().filter(r => isSameMonth(parseISO(r.fecha_inicio), this.selectedDate())));
  reservasCompletadas = computed(() => this.reservasMes().filter(r => r.estado === 'confirmada'));
  reservasPendientes  = computed(() => this.reservasMes().filter(r => r.estado === 'pendiente'));
  reservasCanceladas  = computed(() => this.reservasMes().filter(r => r.estado === 'cancelada'));
  reservasBloqueadas  = computed(() => this.reservasMes().filter(r => r.estado === 'bloqueada'));
  reservasRechazadas  = computed(() => this.reservasMes().filter(r => r.estado === 'rechazada'));

  // Tendencia anual
  reservasMensuales = computed(() => {
    const all = this.reservas();
    return this.meses.map(m => ({
      total:       all.filter(r => isSameMonth(parseISO(r.fecha_inicio), m)).length,
      confirmadas: all.filter(r => r.estado === 'confirmada' && isSameMonth(parseISO(r.fecha_inicio), m)).length,
    }));
  });

  // Precio máximo del catálogo para calcular barras relativas
  maxPrecio = computed(() =>
    Math.max(1, ...this.productosCatalogo().map(p => +(p.precio_max ?? 0)))
  );

  // Colores por posición (leaderboard y tarjetas)
  readonly lbColors = TOP_COLORS;

  constructor() {
    this.iconSet.icons = { cilListNumbered, cilPaperPlane, cilChevronRight, cilChevronLeft };

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
    this.aplicarTendencia(this.reservasMensuales());
  }

  ngOnDestroy(): void {
    this.tendenciaChart?.destroy();
  }

  // ── Gráficas ──────────────────────────────────────────────────────────────

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
              pointStyle: 'circle' as any,
              boxWidth: 8,
              boxHeight: 8,
              padding: 16,
            },
          },
          tooltip: { ...TOOLTIP_BASE },
        },
        scales: {
          x: {
            ticks: { color: 'rgba(20,63,102,0.65)', font: { size: 11 } },
            grid:  { color: 'rgba(47,93,134,0.07)' },
            border: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: { color: 'rgba(20,63,102,0.6)', font: { size: 11 }, stepSize: 1 },
            grid:  { color: 'rgba(47,93,134,0.07)' },
            border: { display: false },
          },
        },
      },
    });
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
