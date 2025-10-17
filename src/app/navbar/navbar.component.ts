import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthenticationService } from '../Services/Autentication/authenticationService';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, MatSidenavModule, MatCheckboxModule, MatButtonModule, MatMenuModule, MatDividerModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

  constructor(private router: Router) {

  }


  ngOnInit() {
    this.letraNombre();
  }

  autServicectx = inject(AuthenticationService);

  nombreU = signal<string | null>('');



  esRutaHome(): boolean {
    return this.router.url === '/';
  }

  estaEnRuta(ruta: string): boolean {
    const urlActual = this.router.url;
    if (ruta === 'mi-boda') {
      return urlActual.includes('mi-boda') || urlActual.includes('dashboard-empresas');
    }
    return urlActual.includes(ruta);
  }

  irARuta(ruta: string, event: Event): void {
    event.preventDefault();
    const urlActual = this.router.url;
    console.log(ruta)

    if (urlActual.includes(ruta)) {
      console.log(`Ya estás en la ruta ${ruta}, no se navega nuevamente.`);
      return;
    }
    else {
      this.router.navigate([`${ruta}`])
    }
  }

  letraNombre() {
    const nameU = localStorage.getItem('nombre')?.charAt(0)
    this.nombreU.set(nameU || null);

  }
  logout(event?: Event): void {
    event?.preventDefault();
    this.autServicectx.logout().subscribe({
      next: () => console.log('Sesión cerrada correctamente'),
      error: err => console.error('Error al cerrar sesión', err)
    });
  }


}

