import { Component, inject, signal } from '@angular/core';
import { AdminNavProveedorComponent } from '../admin-nav-proveedor/admin-nav-proveedor.component';
import { TopBarAdminComponent } from '../top-bar-admin/top-bar-admin.component';
import { ReseniasApiServiceService } from '../Services/Resenias/resenias-api-service.service';
import { Resenia, Resenias, ReseniasEmpresa } from '../Interfaces/Resenia';

@Component({
  selector: 'app-resenias-admin',
  standalone: true,
  imports: [AdminNavProveedorComponent, TopBarAdminComponent],
  templateUrl: './resenias-admin.component.html',
  styleUrl: './resenias-admin.component.scss',
})
export class ReseniasAdminComponent {

  reseniasCtx = inject(ReseniasApiServiceService);
  resenias = signal<ReseniasEmpresa | null>(null);
  arrayResenias = signal<Resenia[]| null>([]);
  idEmpresa = signal<number>(Number(localStorage.getItem('idEmpresa')));

  ngOnInit() {
    this.getReseniasEmpresa();
  }

  getReseniasEmpresa() {
    this.reseniasCtx.getReseniaByEmpresa(Number(this.idEmpresa())).subscribe({
      next: (data ) => {
        this.resenias.set(data);
        this.arrayResenias.set(data?.data!)
        console.log(this.resenias());
        console.log(this.arrayResenias());

      },
      error: (err: Error) => {
        console.log(err.message)
      }
    })

  }
}
