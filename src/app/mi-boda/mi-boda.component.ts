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
import { Router, RouterOutlet } from '@angular/router';
import { InfoCategoria } from '../Interfaces/Categoria';

@Component({
  selector: 'app-mi-boda',
  imports: [MenuMiBodaComponent, NavbarComponent, ActividadesMiBodaComponent, AsyncPipe,
    MatCardModule, MatButtonModule, AsyncPipe, ReactiveFormsModule,
     CardMibodaEmpresaComponent, RouterOutlet],
  templateUrl: './mi-boda.component.html',
  styleUrl: './mi-boda.component.scss'
})
export class MiBodaComponent {
  filtroEmpresas = inject(FiltroEmpresasServiceService);
  servicioDeCategorias = inject(CategoriasServiceService);

  constructor(private router: Router) {

  }

  ngOnInit() {
    console.log(this.companies())
  }

  companies = computed(() =>
    this.filtroEmpresas.empresasFiltradas()

  );

 
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



}
