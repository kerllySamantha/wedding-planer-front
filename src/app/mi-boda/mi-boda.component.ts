import { Component, inject, computed } from '@angular/core';
import { MenuMiBodaComponent } from "../menu-mi-boda/menu-mi-boda.component";
import { NavbarComponent } from "../navbar/navbar.component";
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ActividadesMiBodaComponent } from '../actividades-mi-boda/actividades-mi-boda.component';
import { AsyncPipe } from '@angular/common';
import { CategoriasServiceService } from '../Services/Catergorias/categoria-service.service';
import { map } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { CardMibodaEmpresaComponent } from '../card-miboda-empresa/card-miboda-empresa.component';
import { NotasBodaComponent } from '../notas-boda/notas-boda.component';
import { RouterLink, RouterOutlet } from '@angular/router';
import { InfoCategoria } from '../Interfaces/Categoria';
import { FooterUserComponent } from "../footer-user/footer-user.component";
import { PaginadorComponent } from '../paginador/paginador.component';
import { ServicioFiltrado } from '../Services/servicioFiltrado.service';

@Component({
  selector: 'app-mi-boda',
  imports: [MenuMiBodaComponent, NavbarComponent, ActividadesMiBodaComponent, AsyncPipe,
    MatCardModule, MatButtonModule, ReactiveFormsModule,
    CardMibodaEmpresaComponent, RouterOutlet, FooterUserComponent, NotasBodaComponent, PaginadorComponent],
  templateUrl: './mi-boda.component.html',
  styleUrl: './mi-boda.component.scss'
})
export class MiBodaComponent {
  servicioDeCategorias = inject(CategoriasServiceService);
  filtradoTotalServicectx = inject(ServicioFiltrado);

  companies = computed(() => this.filtradoTotalServicectx.companiesTotalFiltered());
  cargandoEmpresas = computed(() => this.filtradoTotalServicectx.isLoading());

  categorias$ = this.servicioDeCategorias.getCategorias().pipe(
    map((data) =>
      (data?.data as InfoCategoria[] ?? []).filter((categoria) => (categoria.tipos ?? []).length > 0),
    ),
  );

  onCategoriaChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const id = select.value ? Number(select.value) : undefined;
    this.filtradoTotalServicectx.setFilters({ ...(this.filtradoTotalServicectx.filtros() ?? {}), categoria: id });
  }

  onNombreChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.filtradoTotalServicectx.setFilters({ ...(this.filtradoTotalServicectx.filtros() ?? {}), nombre: input.value });
  }

  limpiarFiltros(selectEl: HTMLSelectElement) {
    selectEl.value = '';
    this.filtradoTotalServicectx.setFilters({});
  }

  totalResultados = computed(() => this.filtradoTotalServicectx.paginaMeta().total);
}
