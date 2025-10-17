import { Component, input } from '@angular/core';
import { Empresa } from '../Interfaces/Empresa';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-card-miboda-empresa',
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './card-miboda-empresa.component.html',
  styleUrl: './card-miboda-empresa.component.scss'
})
export class CardMibodaEmpresaComponent {
  empresa = input<Empresa | null>();

}
