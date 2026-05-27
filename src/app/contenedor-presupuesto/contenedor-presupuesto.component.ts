import { AfterViewInit, Component, computed, effect, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { CountdownServiceService } from '../Services/countdown-service.service';
import { CommonModule } from '@angular/common';
import { ArcElement, Chart, DoughnutController, Legend, Tooltip } from 'chart.js';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

@Component({
  selector: 'app-contenedor-presupuesto',
  imports: [CommonModule],
  templateUrl: './contenedor-presupuesto.component.html',
  styleUrl: './contenedor-presupuesto.component.scss'
})
export class ContenedorPresupuestoComponent implements AfterViewInit {
  @ViewChild('presupuestoChart') presupuestoChartRef!: ElementRef<HTMLCanvasElement>;
  private presupuestoChart: Chart | null = null;

  countdownService = inject(CountdownServiceService);

  bodaEncontrada = computed(() => this.countdownService.bodaEncontrada());
  totalEstimado = computed(() => this.countdownService.costeEstimado());
  totalPagado = computed(() => this.countdownService.totalPagado());
  totalRestante = computed(() => this.countdownService.totalRestante());

  ngOnInit() {
    this.countdownService.cargarBodaDelUsuario();
    this.totalEstimado();
  }

  // costeEstimado(): number {
  //   const boda = this.bodaEncontrada();
  //   if (!boda || !boda.presupuestos) return 0;
  //   return boda.presupuestos.reduce((total, p) => total + p.monto_total, 0);
  // }


  constructor() {

    effect(() => {
      this.totalEstimado();
      this.actualizarGrafico();

      // const boda = this.countdownService.bodaEncontrada();
      // const total = boda?.presupuestos?.reduce((acc, p) => acc + p.monto_total, 0) ?? 0;
      // this.totalEstimado.set(total);
    });
  }

  ngAfterViewInit() {
    this.crearGrafico();
  }

  private crearGrafico() {
    if (!this.presupuestoChartRef?.nativeElement) return;

    this.presupuestoChart = new Chart(this.presupuestoChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Pagado', 'Restante'],
        datasets: [{
          data: [this.totalPagado(), Math.max(this.totalRestante(), 0)],
          backgroundColor: ['#34b37b', '#f76c6f'],
          borderWidth: 0,
        }],
      },
      options: {
        cutout: '68%',
        plugins: { legend: { position: 'bottom' } },
      },
    });
  }

  private actualizarGrafico() {
    if (!this.presupuestoChart) return;
    this.presupuestoChart.data.datasets[0].data = [this.totalPagado(), Math.max(this.totalRestante(), 0)];
    this.presupuestoChart.update();
  }

  ngOnDestroy() {
    this.presupuestoChart?.destroy();
  }


}
