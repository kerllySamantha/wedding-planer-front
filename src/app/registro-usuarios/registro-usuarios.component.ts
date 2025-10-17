import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from "../navbar/navbar.component";

@Component({
  selector: 'app-registro-usuarios',
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './registro-usuarios.component.html',
  styleUrl: './registro-usuarios.component.scss'
})
export class RegistroUsuariosComponent {

}
