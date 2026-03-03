import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AdminNavProveedorComponent } from '../admin-nav-proveedor/admin-nav-proveedor.component';
import { TopBarAdminComponent } from '../top-bar-admin/top-bar-admin.component';
import { ReseniasApiServiceService } from '../Services/Resenias/resenias-api-service.service';
import { Estrella, Resenia, Resenias, ReseniasEmpresa } from '../Interfaces/Resenia';
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
  imports: [AdminNavProveedorComponent, TopBarAdminComponent,
    MatIcon, MatCardModule, MatChipsModule, MatProgressBarModule, DashboardCardsReseniasAdminComponent,
    ReseniasAdminValoradasComponent, CardReseniasAdminComponent],
  templateUrl: './resenias-admin.component.html',
  styleUrl: './resenias-admin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReseniasAdminComponent {

  reseniasCtx = inject(ReseniasApiServiceService);
  resenias = signal<ReseniasEmpresa | null>(null);
  arrayResenias = signal<Resenia[] | null>([]);
  estrellas = signal<Estrella[]>([])
  idEmpresa = signal<number>(Number(localStorage.getItem('idEmpresa')));
   sidebarClosed = signal(true);

  ngOnInit() {
    this.getReseniasEmpresa();
    
  }

  getReseniasEmpresa() {
    this.reseniasCtx.getReseniaByEmpresa(Number(this.idEmpresa())).subscribe({
      next: (data) => {
        this.resenias.set(data);
        this.arrayResenias.set(data?.data!)
        this.estrellas.set(data?.estadisticas.estrellas!)

      },
      error: (err: Error) => {
        console.log(err.message)
      }
    })

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

    toggleSidebar() {
    this.sidebarClosed.update(v => !v);
   console.log('es actualizado')
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
