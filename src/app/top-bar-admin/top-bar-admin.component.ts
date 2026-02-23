import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AutenticarHttpClientService } from '../Services/Autentication/autenticar-http-client.service';
import { ReverbServiceTsService } from '../src/app/services/reverb.service.ts.service';
import { AdminNavProveedorComponent } from "../admin-nav-proveedor/admin-nav-proveedor.component";
import { MatMenuItem, MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-top-bar-admin',
  imports: [AdminNavProveedorComponent, MatMenuModule, MatMenuItem, MatMenuTrigger],
  templateUrl: './top-bar-admin.component.html',
  styleUrl: './top-bar-admin.component.scss'
})
export class TopBarAdminComponent {


  anchoVentana = signal(window.innerWidth);
  pantallaMedium = computed(() => this.anchoVentana() <= 986);
  sidebarClosed = false;

  autServicectx = inject(AutenticarHttpClientService);

  nombreEmpresa = signal<string | null>('');

  constructor(private echo: ReverbServiceTsService, private router: Router) { }

  ngOnInit(): void {

    console.log(this.letraNombre());
  }


  letraNombre() {
    const empresa = localStorage.getItem('empresa')!;
    const empresaObj = JSON.parse(empresa);
    // return empresaObj.nombre_empresa;
    this.nombreEmpresa.set(empresaObj.nombre_empresa);


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

}
