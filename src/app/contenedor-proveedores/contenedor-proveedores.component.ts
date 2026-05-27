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
import { Router } from '@angular/router';

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
  private router = inject(Router);


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

  presupuestosPendientes() {
    const boda = this.countdownService.bodaEncontrada();
    const presupuestos = boda?.presupuestos ?? [];

    return presupuestos.filter((p: any) => {
      const total = Number(p?.monto_total ?? 0);
      const pagado = Number(p?.monto_pagado ?? 0);
      return total > pagado;
    });
  }

  irAPagoPresupuesto(id: number) {
    this.router.navigate(['/presupuesto', id]);
  }




}
