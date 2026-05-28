import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavbarComponent } from '../navbar/navbar.component';
import { MenuMiBodaComponent } from "../menu-mi-boda/menu-mi-boda.component";
import { CategoriasServiceService } from '../Services/Catergorias/categoria-service.service';
import { map } from 'rxjs';
import { InfoCategoria } from '../Interfaces/Categoria';
import { ContenedorPresupuestoComponent } from "../contenedor-presupuesto/contenedor-presupuesto.component";
import { ContenedorTiposComponent } from '../contenedor-tipos/contenedor-tipos.component';
import { CountdownServiceService } from '../Services/countdown-service.service';
import { ArcElement, Chart, DoughnutController, Legend, Tooltip } from 'chart.js';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

@Component({
  selector: 'app-contenedor-proveedores',
  imports: [CommonModule, NavbarComponent, MenuMiBodaComponent,
    ContenedorPresupuestoComponent, ContenedorTiposComponent],
  templateUrl: './contenedor-proveedores.component.html',
  styleUrl: './contenedor-proveedores.component.scss'
})
export class ContenedorProveedoresComponent implements AfterViewInit {
  @ViewChild('pagoChart') pagoChartRef!: ElementRef<HTMLCanvasElement>;
  private pagoChart: Chart | null = null;

  selectPago: boolean = false;
  idSelected = signal<number | null>(null);
  presupuestoId = signal<number | null>(null);
  countdownService = inject(CountdownServiceService);
  private categoriasctx = inject(CategoriasServiceService);

  readonly categorias = toSignal(
    this.categoriasctx.getCategorias().pipe(
      map((response) =>
        (response?.data as InfoCategoria[]).filter(
          (categoria) => (categoria.tipos ?? []).length > 0,
        ),
      ),
    ),
  );

  readonly pagosRealizados = computed(() => {
    const boda = this.countdownService.bodaEncontrada();
    const presupuestos = boda?.presupuestos ?? [];
    return presupuestos.filter((p: any) => Number(p?.monto_pagado ?? 0) > 0);
  });

  readonly totalPagadoSection = computed(() =>
    this.pagosRealizados().reduce((acc: number, p: any) => acc + Number(p.monto_pagado ?? 0), 0),
  );

  readonly totalEstimadoSection = computed(() =>
    this.pagosRealizados().reduce((acc: number, p: any) => acc + Number(p.monto_total ?? 0), 0),
  );

  readonly totalPendienteSection = computed(() =>
    Math.max(this.totalEstimadoSection() - this.totalPagadoSection(), 0),
  );

  selectColor(tipo: string) {
    this.selectPago = tipo === 'pago';
    setTimeout(() => {
      if (this.selectPago) this.renderPagoChart();
    });
  }

  clickIdCategoria(id: number) {
    this.idSelected.set(id);
  }

  nombrePresupuesto(presupuesto: any): string {
    return (
      presupuesto?.tipos?.nombre ??
      presupuesto?.tipo_producto?.nombre ??
      `Presupuesto #${presupuesto?.id ?? ''}`
    );
  }

  detallesPagados(presupuesto: any) {
    const items = presupuesto?.items_presupuesto ?? presupuesto?.items ?? [];
    if (!Array.isArray(items)) return [];

    return items
      .map((item: any) => ({
        nombre: item?.nombre_tipo_personalizado || item?.tipo_producto?.nombre || 'Concepto',
        pagado: Number(item?.monto_pagado ?? 0),
        estimado: Number(item?.monto_estimado ?? 0),
      }))
      .filter((item: any) => item.pagado > 0);
  }

  porcentajePagado(presupuesto: any): number {
    const total = Number(presupuesto?.monto_total ?? 0);
    const pagado = Number(presupuesto?.monto_pagado ?? 0);
    if (total <= 0) return 0;
    return Math.min(100, Number(((pagado / total) * 100).toFixed(1)));
  }

  ngAfterViewInit() {
    if (this.selectPago) this.renderPagoChart();
  }

  private renderPagoChart() {
    if (!this.pagoChartRef?.nativeElement) return;
    const totalPagado = this.totalPagadoSection();
    const restante = this.totalPendienteSection();

    this.pagoChart?.destroy();
    this.pagoChart = new Chart(this.pagoChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Pagado', 'Restante'],
        datasets: [{ data: [totalPagado, restante], backgroundColor: ['#f76c6f', '#f3d9de'], borderWidth: 0 }],
      },
      options: { cutout: '72%', plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: false },
    });
  }

  ngOnDestroy() {
    this.pagoChart?.destroy();
  }
}
