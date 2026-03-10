import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReseniasApiServiceService } from '../Services/Resenias/resenias-api-service.service';
import { Estrella, Resenia, ReseniasEmpresa } from '../Interfaces/Resenia';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatIcon } from '@angular/material/icon';
import { DashboardCardsReseniasAdminComponent } from "../dashboard-cards-resenias-admin/dashboard-cards-resenias-admin.component";
import { ReseniasAdminValoradasComponent } from "../resenias-admin-valoradas/resenias-admin-valoradas.component";

import { CardReseniasAdminComponent } from "../card-resenias-admin/card-resenias-admin.component";



@Component({
  selector: 'app-resenias-admin',
  standalone: true,
  imports: [MatIcon, MatCardModule, MatChipsModule, MatProgressBarModule, DashboardCardsReseniasAdminComponent,
    ReseniasAdminValoradasComponent, CardReseniasAdminComponent],
  templateUrl: './resenias-admin.component.html',
  styleUrl: './resenias-admin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReseniasAdminComponent {

  reseniasCtx = inject(ReseniasApiServiceService);
  resenias = signal<ReseniasEmpresa | null>(null);
  arrayResenias = signal<Resenia[] | null>([]);
  estrellas = signal<Estrella[]>([]);
  loading = signal<boolean>(true);
  idEmpresa = signal<number>(Number(localStorage.getItem('idEmpresa')));
  reviewSkeleton = [1, 2, 3, 4, 5, 6];
  ratingSkeleton = [1, 2, 3, 4, 5];

  ngOnInit() {
    this.getReseniasEmpresa();
    
  }

  getReseniasEmpresa() {
    this.loading.set(true);
    this.reseniasCtx.getReseniaByEmpresa(Number(this.idEmpresa())).subscribe({
      next: (data) => {
        this.resenias.set(data);
        this.arrayResenias.set(data?.data!)
        this.estrellas.set(data?.estadisticas.estrellas!);
        this.loading.set(false);

      },
      error: (err: Error) => {
        console.log(err.message);
        this.loading.set(false);
      }
    });

  }

  getResenias() {
    this.reseniasCtx.getReseniaByEmpresa(Number(this.idEmpresa)).subscribe({
      next: (data) => {
        console.log(data);
        console.log(this.idEmpresa())
        this.arrayResenias.set(data?.data!);
        console.log(this.resenias());

      },
      error: (err: Error) => {
        console.log(err.message)
      },
    })
  }

  reseniasctx = inject(ReseniasApiServiceService);
  reseniasPositivas = signal<Resenia[] | null>(null);
  reseniasNegativas = signal<Resenia[] | null>(null);
  empresaId = signal<string>(localStorage.getItem('idEmpresa')!)



  getReseniasFiltradasMejor() {
    this.reseniasctx.getReseniaByFiltro(Number(this.empresaId()), 'positivas').subscribe({
      next: (data) => {
        this.reseniasPositivas.set(data?.data!);
        // console.log(this.reseniasPositivas())
      },
    })
  }

  getReseniasFiltradasPeor() {
    this.reseniasctx.getReseniaByFiltro(Number(this.empresaId()), 'negativas').subscribe({
      next: (data) => {
        this.reseniasNegativas.set(data?.data!);
        // console.log(this.reseniasNegativas())
      },
    })
  }


}
