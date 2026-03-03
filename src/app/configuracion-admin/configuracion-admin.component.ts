import { Component, inject, signal } from '@angular/core';
import { TopBarAdminComponent } from '../top-bar-admin/top-bar-admin.component';
import { AdminNavProveedorComponent } from '../admin-nav-proveedor/admin-nav-proveedor.component';
import { EmpresasApiServiceService } from '../Services/Empresas/empresas-api-service.service';
import { Empresa } from '../Interfaces/Empresa';

@Component({
  selector: 'app-configuracion-admin',
  standalone: true,
  imports: [TopBarAdminComponent, AdminNavProveedorComponent],
  templateUrl: './configuracion-admin.component.html',
  styleUrl: './configuracion-admin.component.scss',
})
export class ConfiguracionAdminComponent {

  empresaCtx = inject(EmpresasApiServiceService);
  empresa = signal<Empresa | null>(null);
  idUser = signal<string>(localStorage.getItem('id')!);

  ngOnInit() {
    this.getEmpresa();

  }

  getEmpresa() {
    this, this.empresaCtx.getEmpresaByUser(Number(this.idUser())).subscribe({
      next: (data) => {
        console.log(data?.data);
        this.empresa.set(data?.data!);

      },
    })
  }

}
