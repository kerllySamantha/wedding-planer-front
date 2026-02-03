import { Component, computed, input } from '@angular/core';
import { Empresa } from '../Interfaces/Empresa';

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-horizontal-card-proveedores',
  imports: [RouterLink],
  templateUrl: './horizontal-card-proveedores.component.html',
  styleUrl: './horizontal-card-proveedores.component.scss'
})
export class HorizontalCardProveedoresComponent {

  empresa = input<Empresa>();

  verTexto = computed(() => {
    const empresa = this.empresa();
    if (!empresa?.descripcion) return false;
    return empresa.descripcion.length > 120
      ? empresa.descripcion.slice(0, 120) + '...'
      : empresa.descripcion;

  });

}
