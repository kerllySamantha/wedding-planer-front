
import { Component, computed, inject, resource, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { CardDashboardComponent } from "../card-dashboard/card-dashboard.component";
import { ReseniasServiceServiceService } from '../Services/Resenias/resenias-service-service.service';
import { firstValueFrom } from 'rxjs';
import { Resenia, Resenias } from '../Interfaces/Resenia';
import { EmpresasServiceServiceService } from '../Services/Empresas/empresas-service-service.service';
import { Empresa } from '../Interfaces/Empresa';
import { CardEmpresaComponent } from '../card-empresa/card-empresa.component';
import { Boda } from '../Interfaces/Boda';
import { BodaServiceServiceService } from '../Services/Bodas/boda-service-service.service';
import { CardBodaComponent } from '../card-boda/card-boda.component';
import { CardActividadesNoviaComponent } from "../card-actividades-novia/card-actividades-novia.component";
import { BuscadorComponent } from "../buscador/buscador.component";

@Component({
  selector: 'app-dashboard',
  imports: [NavbarComponent, CardEmpresaComponent, CardBodaComponent, CardActividadesNoviaComponent, BuscadorComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  reseniasTotalService = inject(ReseniasServiceServiceService);
  empresasTotalService = inject(EmpresasServiceServiceService);
  bodasTotalService = inject(BodaServiceServiceService);

  // protected reseniasResource = resource({
  //   loader: () => firstValueFrom(this.reseniasTotalService.getResenias())
  // });

  // protected reseniasRecibidas = computed(() => this.reseniasResource.value() ?? []);

  // ngOnInit() {
  // firstValueFrom(this.reseniasTotalService.getResenias())
  //   .then(res => {
  //     console.log(res);
  //   })
  //   .catch(err => console.error(err));
  // }

  resenias = signal<Resenia[]>([]);
  empresas = signal<Empresa[]>([]);
  bodas = signal<Boda[]>([]);

  loading = signal(true);
  error = signal<string | null>(null);
  resenias$ = computed(() => this.resenias());
  empresas$ = computed(() => this.empresas());
  bodas$ = computed(() => this.bodas());

  constructor(private router: Router) {

  }


  ngOnInit(): void {
    this.cargarEmpresas();
    this.cargarResenias();
    this.cargarBodas();

    const data = localStorage.getItem('user');
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        if (parsedData['rol'] === 'empresa') {
          this.router.navigate(['/proveedor-dashboard']);
        }
        // Use parsedData
      } catch (e) {
        console.error('Invalid JSON:', e);
        // Handle or fallback
      }
    }


    // if (rol === 'usuario') {
    //   this.router.navigate(['/mi-boda']);
    // }

  }

  cargarResenias(): void {
    this.loading.set(true);
    this.error.set(null);
    this.reseniasTotalService.getResenias().subscribe({
      next: (data) => {
        this.resenias.set(data?.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('No se pudieron cargar las reseñas');
        this.loading.set(false);
      }
    });
  }


  cargarEmpresas() {
    this.loading.set(true);
    this.error.set(null);
    this.empresasTotalService.getEmpresas().subscribe({
      next: (data) => {
        this.empresas.set(data?.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('No se pudieron cargar las reseñas');
        this.loading.set(false);
        console.error(err)
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
