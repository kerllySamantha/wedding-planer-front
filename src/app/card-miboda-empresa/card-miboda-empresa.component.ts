import { Component, computed, input } from '@angular/core';
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

  verTexto = computed(() => {
    const empresa = this.empresa();
    if (!empresa?.direccion) return false;
    return empresa.direccion.length > 35
      ? empresa.direccion.slice(0, 35) + '...'
      : empresa.direccion;

  });

}
