import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AutenticarHttpClientService } from '../Services/Autentication/autenticar-http-client.service';
import { ReverbServiceTsService } from '../src/app/services/reverb.service.ts.service';
import { AdminNavProveedorComponent } from "../admin-nav-proveedor/admin-nav-proveedor.component";
import { MatMenuModule } from '@angular/material/menu';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-top-bar-admin',
  standalone: true,
  imports: [AdminNavProveedorComponent, MatMenuModule, NgClass],
  templateUrl: './top-bar-admin.component.html',
  styleUrls: ['./top-bar-admin.component.scss']
})
export class TopBarAdminComponent {

  // Señales para manejar la UI
  sidebarOpen = signal(false);
  anchoVentana = signal(window.innerWidth);
  isMobile = computed(() => this.anchoVentana() <= 986);

  nombreEmpresa = signal<string>('');

  private authService = inject(AutenticarHttpClientService);

  constructor(private router: Router, private echo: ReverbServiceTsService) { }

  ngOnInit(): void {
    this.cargarNombreEmpresa();
    window.addEventListener('resize', () => this.anchoVentana.set(window.innerWidth));
  }

  // Toggle sidebar
  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  // Handler del botón hamburguesa
  onHamburgerClick() {
    console.log("Hamburguesa pulsada");
    this.toggleSidebar();
  }

  // Cargar nombre de la empresa desde localStorage
  private cargarNombreEmpresa() {
    const empresa = localStorage.getItem('empresa');
    if (empresa) {
      const empresaObj = JSON.parse(empresa);
      this.nombreEmpresa.set(empresaObj.nombre_empresa || '');
    }
  }

  // Logout
  logout(event?: Event) {
    event?.preventDefault();
    this.authService.logout().subscribe({
      next: () => {
        console.log('Sesión cerrada correctamente');
        localStorage.clear();
        this.router.navigate(['dashboard-empresas'], { replaceUrl: true });
      },
      error: err => console.error('Error al cerrar sesión', err)
    });
  }
}