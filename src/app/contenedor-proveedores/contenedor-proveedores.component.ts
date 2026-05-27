import { AsyncPipe, CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { MenuMiBodaComponent } from "../menu-mi-boda/menu-mi-boda.component";
import { CategoriasServiceService } from '../Services/Catergorias/categoria-service.service';
import { map, tap } from 'rxjs';
import { InfoCategoria } from '../Interfaces/Categoria';
import { ContenedorPresupuestoComponent } from "../contenedor-presupuesto/contenedor-presupuesto.component";
import { TiposApiService } from '../Services/Tipos/tipos-api.service';
import { TiposHttpService } from '../Services/Tipos/tipos-http.service';
import { TipoSimple } from '../Interfaces/Tipos';
import { ContenedorTiposComponent } from '../contenedor-tipos/contenedor-tipos.component';
import { CountdownServiceService } from '../Services/countdown-service.service';
import { ArcElement, Chart, DoughnutController, Legend, Tooltip } from 'chart.js';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

@Component({
  selector: 'app-contenedor-proveedores',
  imports: [CommonModule, NavbarComponent, MenuMiBodaComponent,
    AsyncPipe, ContenedorPresupuestoComponent, ContenedorTiposComponent],
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


  selectColor(tipo: string) {
    this.selectPago = tipo === 'pago';
    setTimeout(() => {
      if (this.selectPago) this.renderPagoChart();
    });
  }


  categoriasctx = inject(CategoriasServiceService);


  categorias$ = this.categoriasctx.getCategorias().pipe(
    map((response) =>
      (response?.data as InfoCategoria[]).filter((categoria) =>
        (categoria.tipos ?? []).length > 0,
      ),
    ),
  );


  clickIdCategoria(id: number) {
    this.idSelected.set(id);
  }

  pagosRealizados() {
    const boda = this.countdownService.bodaEncontrada();
    const presupuestos = boda?.presupuestos ?? [];

    return presupuestos.filter((p: any) => {
      const pagado = Number(p?.monto_pagado ?? 0);
      return pagado > 0;
    });
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
      .map((item: any) => {
        const pagado = Number(item?.monto_pagado ?? 0);
        const estimado = Number(item?.monto_estimado ?? 0);
        return {
          nombre: item?.nombre_tipo_personalizado || item?.tipo_producto?.nombre || 'Concepto',
          pagado,
          estimado,
        };
      })
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
    const pagos = this.pagosRealizados();
    const totalPagado = pagos.reduce((acc: number, p: any) => acc + Number(p.monto_pagado ?? 0), 0);
    const totalEstimado = pagos.reduce((acc: number, p: any) => acc + Number(p.monto_total ?? 0), 0);
    const restante = Math.max(totalEstimado - totalPagado, 0);

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
