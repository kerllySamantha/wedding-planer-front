
import { Component, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthenticationService } from '../Services/Autentication/authenticationService';
import { filter } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, MatSidenavModule, RouterLinkActive,
    MatCheckboxModule, MatButtonModule, MatMenuModule, MatDividerModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {


  autServicectx = inject(AuthenticationService);
  nombreU = signal<string | null>('');
  rutaActiva: string = '';
  rolAuth = computed(() => !!this.autServicectx.rol());


  constructor(private router: Router) {


    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.rutaActiva = event.urlAfterRedirects;
    });
  }




  ngOnInit() {
    this.letraNombre();

    console.log(this.rolAuth());

    this.autServicectx.rol()
  }

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


  esRutaActiva(ruta: string): boolean {

    return this.rutaActiva.includes(ruta);
  }


  letraNombre() {
    const nameU = localStorage.getItem('nombre')?.charAt(0)
    this.nombreU.set(nameU || null);

  }
  logout(event?: Event): void {
    event?.preventDefault();
    this.autServicectx.logout().subscribe({
      next: () => {
        console.log('Sesión cerrada correctamente');
        this.router.navigate(['']);
      },
      error: err => console.error('Error al cerrar sesión', err)
    });
  }



}

