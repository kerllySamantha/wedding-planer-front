import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
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

@Component({
  selector: 'app-contenedor-proveedores',
  imports: [CommonModule, NavbarComponent, MenuMiBodaComponent,
    AsyncPipe, ContenedorPresupuestoComponent, ContenedorTiposComponent],
  templateUrl: './contenedor-proveedores.component.html',
  styleUrl: './contenedor-proveedores.component.scss'
})
export class ContenedorProveedoresComponent {

  selectPago: boolean = false;
  idSelected = signal<number | null>(null);
  presupuestoId = signal<number | null>(null);
  countdownService = inject(CountdownServiceService);


  selectColor(tipo: string) {
    this.selectPago = tipo === 'pago';
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




}
