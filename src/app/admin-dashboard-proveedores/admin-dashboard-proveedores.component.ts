import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminNavProveedorComponent } from "../admin-nav-proveedor/admin-nav-proveedor.component";
import { TopBarAdminComponent } from "../top-bar-admin/top-bar-admin.component";

@Component({
  selector: 'app-admin-dashboard-proveedores',
  standalone: true,
  imports: [AdminNavProveedorComponent, RouterOutlet, TopBarAdminComponent],
  templateUrl: './admin-dashboard-proveedores.component.html',
  styleUrl: './admin-dashboard-proveedores.component.scss'
})
export class AdminDashboardProveedoresComponent {}
