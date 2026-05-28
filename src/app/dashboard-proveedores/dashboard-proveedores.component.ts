import { Component, computed, inject, signal } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { Boda } from '../Interfaces/Boda';
import { Empresa } from '../Interfaces/Empresa';
import { Resenia } from '../Interfaces/Resenia';
import { BodaServiceServiceService } from '../Services/Bodas/boda-service-service.service';
import { EmpresasServiceServiceService } from '../Services/Empresas/empresas-service-service.service';
import { ReseniasServiceServiceService } from '../Services/Resenias/resenias-service-service.service';
import { CardEmpresaComponent } from "../card-empresa/card-empresa.component";
import { CardProveedoresComponent } from '../card-proveedores/card-proveedores.component';
import { BuscadorComponent } from "../buscador/buscador.component";
import { NgClass } from '@angular/common';
import { FiltroProveedoresComponent } from '../filtro-proveedores/filtro-proveedores.component';
import { ServicioFiltrado } from '../Services/servicioFiltrado.service';
import { VisualizadorProveedoresCardsComponent } from "../visualizador-proveedores-cards/visualizador-proveedores-cards.component";
import { HorizontalCardProveedoresComponent } from "../horizontal-card-proveedores/horizontal-card-proveedores.component";
import { RouterOutlet } from '@angular/router';
import { PaginadorComponent } from '../paginador/paginador.component';
import { FooterUserComponent } from "../footer-user/footer-user.component";


@Component({
  selector: 'app-dashboard-proveedores',
  imports: [NavbarComponent, CardProveedoresComponent, BuscadorComponent, FiltroProveedoresComponent,
    VisualizadorProveedoresCardsComponent, HorizontalCardProveedoresComponent,
    RouterOutlet, PaginadorComponent, FooterUserComponent],
  templateUrl: './dashboard-proveedores.component.html',
  styleUrl: './dashboard-proveedores.component.scss'
})
export class DashboardProveedoresComponent {

  // empresasTotalService = inject(EmpresasServiceServiceService);

  filtradoTotalServicectx = inject(ServicioFiltrado)

  empresas = computed(() =>
    this.filtradoTotalServicectx.companiesTotalFiltered()

  );

  

  resenias = signal<Resenia[]>([]);
  // empresas = signal<Empresa[]>([]);
  bodas = signal<Boda[]>([]);

  modo = signal<'listado' | 'imagenes' | 'mapa'>('listado');
  readonly skeletonItems = Array.from({ length: 8 }, (_, i) => i);

 

  loading = signal(true);
  error = signal<string | null>(null);

  cambiarModo(nuevo: 'listado' | 'imagenes' | 'mapa') {
    this.modo.set(nuevo);
    console.log(this.modo())
  }
  // empresas$ = computed(() => this.empresas());

  // ngOnInit(): void {
  //   this.cargarEmpresas();
  //   console.log(window.screen)
  
  // }

  
  // cargarEmpresas() {
  //   this.loading.set(true);
  //   this.error.set(null);
  //   this.empresasTotalService.getEmpresas().subscribe({
  //     next: (data) => {
  //       this.empresas.set(data?.data ?? []);
  //       this.loading.set(false);
  //     },
  //     error: (err) => {
  //       this.error.set('No se pudieron cargar las reseñas');
  //       this.loading.set(false);
  //       console.error(err)
  //     }
  //   });
  // }

}
