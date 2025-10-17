import { Component, input } from '@angular/core';
import { Empresa } from '../Interfaces/Empresa';

@Component({
  selector: 'app-card-empresa',
  imports: [],
  templateUrl: './card-empresa.component.html',
  styleUrl: './card-empresa.component.scss'
})
export class CardEmpresaComponent {

    empresa = input<Empresa | null>();

}
