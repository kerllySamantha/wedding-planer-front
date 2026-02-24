import { Component } from '@angular/core';
import { TopBarAdminComponent } from '../top-bar-admin/top-bar-admin.component';
import { AdminNavProveedorComponent } from '../admin-nav-proveedor/admin-nav-proveedor.component';

@Component({
  selector: 'app-configuracion-admin',
  standalone: true,
  imports: [TopBarAdminComponent, AdminNavProveedorComponent],
  templateUrl: './configuracion-admin.component.html',
  styleUrl: './configuracion-admin.component.scss',
})
export class ConfiguracionAdminComponent {

}
