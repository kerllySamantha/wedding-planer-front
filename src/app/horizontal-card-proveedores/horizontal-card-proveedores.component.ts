import { Component, input } from '@angular/core';
import { Empresa } from '../Interfaces/Empresa';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-horizontal-card-proveedores',
  imports: [CommonModule, RouterLink],
  templateUrl: './horizontal-card-proveedores.component.html',
  styleUrl: './horizontal-card-proveedores.component.scss'
})
export class HorizontalCardProveedoresComponent {

  empresa = input<Empresa>();

}
