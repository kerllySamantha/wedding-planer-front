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
  usuarioAutenticado = computed(() => this.autServicectx.auth() && this.autServicectx.rol() === 'usuario');
  ocultarBodasRealesNuevoUsuario = signal(localStorage.getItem('ocultar_bodas_reales_nuevo_usuario') === 'true');
  mostrarBodasRealesUsuario = signal(!this.ocultarBodasRealesNuevoUsuario());
  mostrarBodasReales = computed(() => this.mostrarBodasRealesUsuario());

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

  alternarBodasReales(): void {
    const visible = !this.mostrarBodasRealesUsuario();
    this.mostrarBodasRealesUsuario.set(visible);

    if (visible && !this.bodas().length) {
      this.cargarBodas();
    }

    if (this.usuarioAutenticado()) {
      if (visible) {
        this.ocultarBodasRealesNuevoUsuario.set(false);
        localStorage.removeItem('ocultar_bodas_reales_nuevo_usuario');
      } else {
        localStorage.setItem('ocultar_bodas_reales_nuevo_usuario', 'true');
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
        const bodasPublicables = (data?.data ?? []).filter((boda) =>
          this.esBodaPublicable(boda),
        );
        this.bodas.set(bodasPublicables);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    })
  }

  private esBodaPublicable(boda: Boda): boolean {
    const tieneFotos = (boda.fotos?.length ?? 0) > 0;
    const tienePresupuestoAceptadoYPagado = (boda.presupuestos ?? []).some(
      (presupuesto) =>
        presupuesto.estado === 'aceptado_usuario' &&
        (presupuesto.monto_pagado ?? 0) > 0,
    );

    return tieneFotos && tienePresupuestoAceptadoYPagado;
  }
}
