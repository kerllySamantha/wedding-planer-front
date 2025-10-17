import { Component } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { LoginEmpresasComponent } from "../login-empresas/login-empresas.component";

@Component({
  selector: 'app-dashboard-empresas',
  imports: [NavbarComponent, LoginEmpresasComponent],
  templateUrl: './dashboard-empresas.component.html',
  styleUrl: './dashboard-empresas.component.scss'
})
export class DashboardEmpresasComponent {

}
