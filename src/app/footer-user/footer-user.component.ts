import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthenticationService } from '../Services/Autentication/authenticationService';

@Component({
  selector: 'app-footer-user',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './footer-user.component.html',
  styleUrl: './footer-user.component.scss',
})
export class FooterUserComponent {

  private authService = inject(AuthenticationService);

  currentYear = new Date().getFullYear();

  estaAutenticado = computed(() => !!this.authService.auth());
  esUsuario       = computed(() => this.authService.rol() === 'usuario');

  userLinks = [
    { label: 'Mi boda',     route: '/mi-boda' },
    { label: 'Presupuesto', route: '/tools/presupuesto' },
    { label: 'Mi perfil',   route: '/perfil-user' },
  ];

  exploraLinks = [
    { label: 'Inicio',      route: '/dashboard' },
    { label: 'Proveedores', route: '/dashboard-proveedores' },
  ];

  accesoLinks = [
    { label: 'Iniciar sesión', route: '/login' },
    { label: 'Registrarse',    route: '/registerUser' },
    { label: 'Soy proveedor',  route: '/login-empresa' },
  ];
}
