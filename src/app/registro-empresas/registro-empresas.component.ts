import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-registro-empresas',
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './registro-empresas.component.html',
  styleUrl: './registro-empresas.component.scss'
})
export class RegistroEmpresasComponent {

}
