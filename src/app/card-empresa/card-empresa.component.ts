import { Component, computed, input } from '@angular/core';
import { Empresa } from '../Interfaces/Empresa';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-card-empresa',
  imports: [RouterLink],
  templateUrl: './card-empresa.component.html',
  styleUrl: './card-empresa.component.scss'
})
export class CardEmpresaComponent {

  empresa = input<Empresa | null>();

  verTexto = computed(() => {
    const empresa = this.empresa();
    if (!empresa?.direccion) return false;
    return empresa.direccion.length > 35
      ? empresa.direccion.slice(0, 35) + '...'
      : empresa.direccion;

  });
}

