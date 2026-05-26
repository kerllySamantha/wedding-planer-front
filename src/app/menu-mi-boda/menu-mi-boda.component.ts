import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { APP_PATHS } from '../app.paths';


@Component({
  selector: 'app-menu-mi-boda',
  imports: [CommonModule],
  templateUrl: './menu-mi-boda.component.html',
  styleUrl: './menu-mi-boda.component.scss'
})
export class MenuMiBodaComponent {

  readonly menuItems: ReadonlyArray<{ label: string; icon: string; route: string; fragment?: string }> = [
    { label: 'Mi boda', icon: 'assets/images/anillos.svg', route: `/${APP_PATHS.userWedding}` },
    { label: 'Tareas', icon: 'assets/images/provedor1.svg', route: `/${APP_PATHS.userWedding}`, fragment: 'actividades' },
    { label: 'Proveedores', icon: 'assets/images/provedor2.svg', route: `/${APP_PATHS.publicSuppliers}` },
    { label: 'Invitados', icon: 'assets/images/1.png', route: `/${APP_PATHS.userProfile}` },
    { label: 'Mesas', icon: 'assets/images/2.png', route: `/${APP_PATHS.budgetTool}` },
    { label: 'Presupuesto', icon: 'assets/images/3.png', route: `/${APP_PATHS.budgetTool}` },
    { label: 'Vestidos', icon: 'assets/images/4.png', route: `/${APP_PATHS.userProfile}` },
  ] as const;

  constructor(public router: Router) {

  }

  irARuta(ruta: string, event: Event, fragment?: string): void {
    event.preventDefault();
    const urlActual = this.router.url;

    if (urlActual.includes(ruta) && !fragment) {
      console.log(`Ya estás en la ruta ${ruta}, no se navega nuevamente.`);
      return;
    }

    this.router.navigate([ruta], { fragment });
  }


}
