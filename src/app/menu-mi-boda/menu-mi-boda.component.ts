import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu-mi-boda',
  imports: [],
  templateUrl: './menu-mi-boda.component.html',
  styleUrl: './menu-mi-boda.component.scss'
})
export class MenuMiBodaComponent {
  constructor(private router: Router) {}

  irARuta(ruta: string, event: Event): void {
    event.preventDefault();
    const urlActual = this.normalizar(this.router.url);
    const destino = this.normalizar(`/${ruta}`);

    if (urlActual === destino || urlActual.startsWith(`${destino}/`)) return;

    this.router.navigate([ruta]);
  }

  esRutaActiva(ruta: string): boolean {
    const url = this.normalizar(this.router.url);

    if (ruta === 'mi-boda') {
      return (
        url.includes('/mi-boda') &&
        !url.includes('/dashboard-proveedores') &&
        !url.includes('/tools/presupuesto') &&
        !url.includes('/perfil-user') &&
        !url.includes('/dashboard')
      );
    }

    if (ruta === 'tools/presupuesto') {
      return url.includes('/tools/presupuesto') || url.includes('/presupuesto');
    }

    const objetivo = this.normalizar(`/${ruta}`);
    return url === objetivo || url.startsWith(`${objetivo}/`);
  }

  private normalizar(value: string): string {
    return value.split('?')[0].split('#')[0].replace(/\/+$/, '').toLowerCase();
  }
}
