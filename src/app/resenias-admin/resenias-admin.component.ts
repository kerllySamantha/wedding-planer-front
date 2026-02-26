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



@Component({
  selector: 'app-resenias-admin',
  standalone: true,
  imports: [AdminNavProveedorComponent, TopBarAdminComponent,
    MatIcon, MatCardModule, MatChipsModule, MatProgressBarModule, DashboardCardsReseniasAdminComponent, ReseniasAdminValoradasComponent],
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
}
