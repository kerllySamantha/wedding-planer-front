import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { MenuMiBodaComponent } from "../menu-mi-boda/menu-mi-boda.component";

@Component({
  selector: 'app-contenedor-proveedores',
  imports: [CommonModule, NavbarComponent, MenuMiBodaComponent],
  templateUrl: './contenedor-proveedores.component.html',
  styleUrl: './contenedor-proveedores.component.scss'
})
export class ContenedorProveedoresComponent {

}
