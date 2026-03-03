import { Component, inject, OnInit, signal } from '@angular/core';
import { ReverbServiceTsService } from '../src/app/services/reverb.service.ts.service';
import { AdminNavProveedorComponent } from "../admin-nav-proveedor/admin-nav-proveedor.component";
import {  Router } from '@angular/router';
import { AutenticarHttpClientService } from '../Services/Autentication/autenticar-http-client.service';
import { CardsDashboardProveedorComponent } from "../cards-dashboard-proveedor/cards-dashboard-proveedor.component";
import { TopBarAdminComponent } from "../top-bar-admin/top-bar-admin.component";

@Component({
  selector: 'app-admin-dashboard-proveedores',
  standalone: true,
  imports: [AdminNavProveedorComponent, CardsDashboardProveedorComponent, TopBarAdminComponent],
  templateUrl: './admin-dashboard-proveedores.component.html',
  styleUrl: './admin-dashboard-proveedores.component.scss'
})
export class AdminDashboardProveedoresComponent implements OnInit {

  anchoVentana = signal(window.innerWidth);
  sidebarClosed = signal(true);
  autServicectx = inject(AutenticarHttpClientService);

  constructor(private echo: ReverbServiceTsService, private router: Router) { }

  ngOnInit(): void {


  }

  logout(event?: Event): void {
    event?.preventDefault();
    this.autServicectx.logout().subscribe({
      next: () => {
        console.log('Sesión cerrada correctamente');
        localStorage.clear();
        this.router.navigate(['dashboard-empresas'], { replaceUrl: true });
        console.log(this.router?.navigated);
      },
      error: err => console.error('Error al cerrar sesión', err)
    });
  }



  toggleSidebar() {
    this.sidebarClosed.update(v => !v);
   console.log('es actualizado')
  }



}
