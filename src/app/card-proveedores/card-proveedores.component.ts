import { Component, input } from '@angular/core';
import { Empresa } from '../Interfaces/Empresa';
import { state, style, transition, trigger, animate } from '@angular/animations';

@Component({
  selector: 'app-card-proveedores',
  imports: [],
  templateUrl: './card-proveedores.component.html',
  styleUrl: './card-proveedores.component.scss', 
  animations: [
    trigger('flip', [
      state('false', style({ transform: 'none' })),
      state('true', style({ transform: 'rotateY(180deg)' })),
      transition('false <=> true', animate('0.8s ease-in-out'))
    ])
  ]
})
export class CardProveedoresComponent {
  empresa = input<Empresa | null>();
}
