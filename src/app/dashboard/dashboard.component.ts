import { Router } from '@angular/router';
import { Resenia } from '../Interfaces/Resenia';

import { Component, computed, inject, signal } from '@angular/core';

import { NavbarComponent } from '../navbar/navbar.component';

import { ReseniasServiceServiceService } from '../Services/Resenias/resenias-service-service.service';


import { CardEmpresaComponent } from '../card-empresa/card-empresa.component';
import { Boda } from '../Interfaces/Boda';
import { BodaServiceServiceService } from '../Services/Bodas/boda-service-service.service';
import { CardBodaComponent } from '../card-boda/card-boda.component';
import { CardActividadesNoviaComponent } from "../card-actividades-novia/card-actividades-novia.component";
import { BuscadorComponent } from "../buscador/buscador.component";
import { AuthenticationService } from '../Services/Autentication/authenticationService';
import { ServicioFiltrado } from '../Services/servicioFiltrado.service';

@Component({
  selector: 'app-dashboard',
  imports: [NavbarComponent, CardEmpresaComponent, CardBodaComponent, CardActividadesNoviaComponent, BuscadorComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  reseniasTotalService = inject(ReseniasServiceServiceService);
  bodasTotalService = inject(BodaServiceServiceService);
  autServicectx = inject(AuthenticationService);

  resenias = signal<Resenia[]>([]);
  filtradoTotalServicectx = inject(ServicioFiltrado);
  empresas = computed(() => this.filtradoTotalServicectx.companiesTotalFiltered());
  bodas = signal<Boda[]>([]);

  loading = signal(true);
  error = signal<string | null>(null);
  rol = signal<string | null>(localStorage.getItem('rol')!)

  rolAuth = computed(() => !!this.autServicectx.rol());
  mostrarBodasRealesUsuario = signal(false);
  usuarioAutenticado = computed(() => this.autServicectx.auth() && this.autServicectx.rol() === 'usuario');
  mostrarBodasReales = computed(() => !this.usuarioAutenticado() || this.mostrarBodasRealesUsuario());

  constructor(private router: Router) {

  }


  ngOnInit(): void {
    this.cargarResenias();

    if (this.mostrarBodasReales()) {
      this.cargarBodas();
    }

    if (this.rol() == 'empresa') {
      this.router.navigate(['/proveedor-dashboard']);
    }
  }
  activarBodasReales(): void {
    if (!this.mostrarBodasRealesUsuario()) {
      this.mostrarBodasRealesUsuario.set(true);
      if (!this.bodas().length) {
        this.cargarBodas();
      }
    }
  }


  cargarResenias(): void {
    this.loading.set(true);
    this.error.set(null);
    this.reseniasTotalService.getResenias().subscribe({
      next: (data) => {
        this.resenias.set(data?.data ?? []);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set('No se pudieron cargar las reseñas');
        console.log(err.message);
        this.loading.set(false);
      }
    });
  }


  cargarBodas() {
    this.loading.set(true);
    this.error.set(null);
    this.bodasTotalService.getBodas().subscribe({
      next: (data) => {
        this.bodas.set(data?.data ?? []);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    })
  }
}
