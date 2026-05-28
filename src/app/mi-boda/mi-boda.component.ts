import { Component, inject, computed } from '@angular/core';
import { MenuMiBodaComponent } from "../menu-mi-boda/menu-mi-boda.component";
import { NavbarComponent } from "../navbar/navbar.component";
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ActividadesMiBodaComponent } from '../actividades-mi-boda/actividades-mi-boda.component';
import { FiltroEmpresasServiceService } from '../filtro-empresas-service.service';
import { AsyncPipe } from '@angular/common';
import { CategoriasServiceService } from '../Services/Catergorias/categoria-service.service';
import { map } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { CardMibodaEmpresaComponent } from '../card-miboda-empresa/card-miboda-empresa.component';
import { NotasBodaComponent } from '../notas-boda/notas-boda.component';
import { RouterLink, RouterOutlet } from '@angular/router';
import { InfoCategoria } from '../Interfaces/Categoria';
import { FooterUserComponent } from "../footer-user/footer-user.component";

@Component({
  selector: 'app-mi-boda',
  imports: [MenuMiBodaComponent, NavbarComponent, ActividadesMiBodaComponent, AsyncPipe,
    MatCardModule, MatButtonModule, ReactiveFormsModule,
    CardMibodaEmpresaComponent, RouterOutlet, RouterLink, FooterUserComponent, NotasBodaComponent],
  templateUrl: './mi-boda.component.html',
  styleUrl: './mi-boda.component.scss'
})
export class MiBodaComponent {
  filtroEmpresas = inject(FiltroEmpresasServiceService);
  servicioDeCategorias = inject(CategoriasServiceService);


  companies = computed(() =>
    this.filtroEmpresas.empresasFiltradas()

  );

  cargandoEmpresas = computed(() => this.filtroEmpresas.empresasCargando());

 
  categorias$ = this.servicioDeCategorias.getCategorias().pipe(
    map((data) =>
      (data?.data as InfoCategoria[] ?? []).filter((categoria) => (categoria.tipos ?? []).length > 0),
    ),
  );

  onCategoriaChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const id = select.value ? Number(select.value) : null;
    this.filtroEmpresas.seleccionarCategoria(id);
  }

  onNombreChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.filtroEmpresas.buscarPorNombre(input.value);
  }

  limpiarFiltros(selectEl: HTMLSelectElement) {
    selectEl.value = '';
    this.filtroEmpresas.seleccionarCategoria(null);
    this.filtroEmpresas.buscarPorNombre('');
  }

  totalResultados = computed(() => this.filtroEmpresas.empresasFiltradas().length);



}
