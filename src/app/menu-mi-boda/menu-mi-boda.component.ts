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
    const urlActual = this.router.url;

    if (urlActual.includes(ruta)) {
      return;
    }

    this.router.navigate([ruta]);
  }

  esRutaActiva(ruta: string): boolean {
    return this.router.url.includes(ruta);
  }
}
