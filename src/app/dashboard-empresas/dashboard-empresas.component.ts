import { Component } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { LoginEmpresasComponent } from "../login-empresas/login-empresas.component";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-dashboard-empresas',
  imports: [NavbarComponent, LoginEmpresasComponent, RouterOutlet],
  templateUrl: './dashboard-empresas.component.html',
  styleUrl: './dashboard-empresas.component.scss'
})
export class DashboardEmpresasComponent {

}
