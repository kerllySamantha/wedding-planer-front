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
  bodasPublicadasPorUsuario = signal<number[]>(this.obtenerBodasPublicadas());
  puedePublicarSuBoda = signal(false);
  bodaPropiaId = signal<number | null>(null);

  constructor(private router: Router) {

  }


  ngOnInit(): void {
    this.cargarResenias();

    this.cargarBodas();
    this.evaluarPublicacionManual();

    if (this.rol() == 'empresa') {
      this.router.navigate(['/proveedor-dashboard']);
    }
  }




  private obtenerBodasPublicadas(): number[] {
    const raw = localStorage.getItem('bodas_publicadas_usuario');
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((id) => Number.isInteger(id)) : [];
    } catch {
      return [];
    }
  }

  private guardarBodasPublicadas(ids: number[]): void {
    this.bodasPublicadasPorUsuario.set(ids);
    localStorage.setItem('bodas_publicadas_usuario', JSON.stringify(ids));
  }

  publicarMiBoda(): void {
    const bodaId = this.bodaPropiaId();
    if (!bodaId) return;
    const ids = this.bodasPublicadasPorUsuario();
    if (!ids.includes(bodaId)) {
      this.guardarBodasPublicadas([...ids, bodaId]);
      this.cargarBodas();
    }
    this.puedePublicarSuBoda.set(false);
  }

  private evaluarPublicacionManual(): void {
    const usuarioId = this.autServicectx.auth()?.id;
    if (!usuarioId || !this.usuarioAutenticado()) return;

    this.bodasTotalService.getBodaByUserId(usuarioId).subscribe({
      next: (res) => {
        const boda = res?.data;
        if (!boda) return;
        this.bodaPropiaId.set(boda.id);
        const yaPublicada = this.bodasPublicadasPorUsuario().includes(boda.id);
        this.puedePublicarSuBoda.set(!this.esBodaPublicable(boda) && !yaPublicada);
      },
      error: () => this.puedePublicarSuBoda.set(false),
    });
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
        const bodasPublicables = (data?.data ?? []).filter((boda) => this.esBodaPublicable(boda) || this.bodasPublicadasPorUsuario().includes(boda.id));
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
    const tienePresupuestoAceptadoYPagado = (boda.presupuestos ?? []).some((presupuesto) => presupuesto.estado === 'aceptado_usuario' && (presupuesto.monto_pagado ?? 0) > 0);
    return tieneFotos && tienePresupuestoAceptadoYPagado;
  }
}
