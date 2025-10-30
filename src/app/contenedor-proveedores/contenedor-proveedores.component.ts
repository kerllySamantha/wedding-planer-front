import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { MenuMiBodaComponent } from "../menu-mi-boda/menu-mi-boda.component";
import { CategoriasServiceService } from '../Services/Catergorias/categoria-service.service';
import { map, tap } from 'rxjs';
import { Categoria } from '../Interfaces/Categoria';
import { ContenedorPresupuestoComponent } from "../contenedor-presupuesto/contenedor-presupuesto.component";

@Component({
  selector: 'app-contenedor-proveedores',
  imports: [CommonModule, NavbarComponent, MenuMiBodaComponent, AsyncPipe, ContenedorPresupuestoComponent],
  templateUrl: './contenedor-proveedores.component.html',
  styleUrl: './contenedor-proveedores.component.scss'
})
export class ContenedorProveedoresComponent {

  selectPago: boolean = false;

  selectColor(tipo: string) {
    this.selectPago = tipo === 'pago';
  }

  categoriasctx = inject(CategoriasServiceService);

  categorias$ = this.categoriasctx.getCategorias().pipe(
    // tap(response => console.log(response?.data as Categoria[])),
    map(response => response?.data as Categoria[])
  );



}
