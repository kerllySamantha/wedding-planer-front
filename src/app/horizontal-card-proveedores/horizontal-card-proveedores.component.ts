import { Component, input } from '@angular/core';
import { Empresa } from '../Interfaces/Empresa';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-horizontal-card-proveedores',
  imports: [CommonModule],
  templateUrl: './horizontal-card-proveedores.component.html',
  styleUrl: './horizontal-card-proveedores.component.scss'
})
export class HorizontalCardProveedoresComponent {

  empresa = input<Empresa>();

}
