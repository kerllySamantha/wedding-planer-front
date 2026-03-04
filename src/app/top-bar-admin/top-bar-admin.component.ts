import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { AutenticarHttpClientService } from '../Services/Autentication/autenticar-http-client.service';
import { AdminNavProveedorComponent } from '../admin-nav-proveedor/admin-nav-proveedor.component';

@Component({
  selector: 'app-top-bar-admin',
  standalone: true,
  imports: [AdminNavProveedorComponent, MatMenuModule, ],
  templateUrl: './top-bar-admin.component.html',
  styleUrls: ['./top-bar-admin.component.scss']
})
export class TopBarAdminComponent {
  sidebarOpen = signal(false);
  nombreEmpresa = signal<string>('');

  private authService = inject(AutenticarHttpClientService);

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.cargarNombreEmpresa();
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  onHamburgerClick() {
    this.toggleSidebar();
  }

  private cargarNombreEmpresa() {
    const empresa = localStorage.getItem('empresa');
    if (empresa) {
      const empresaObj = JSON.parse(empresa);
      this.nombreEmpresa.set(empresaObj.nombre_empresa || '');
    }
  }

  logout(event?: Event) {
    event?.preventDefault();
    this.authService.logout().subscribe({
      next: () => {
        localStorage.clear();
        this.router.navigate(['/dashboard-empresas'], { replaceUrl: true });
      },
      error: err => console.error('Error al cerrar sesion', err)
    });
  }
}
