import { Component, computed, effect, input, signal } from '@angular/core';
import { Empresa } from '../Interfaces/Empresa';
import { state, style, transition, trigger, animate } from '@angular/animations';
import { RouterLink } from "@angular/router";
import { ProductoEmpresa } from '../Interfaces/Producto';

@Component({
  selector: 'app-card-proveedores',
  imports: [RouterLink],
  templateUrl: './card-proveedores.component.html',
  styleUrl: './card-proveedores.component.scss',
  animations: [
    trigger('flip', [
      state('front', style({ transform: 'rotateY(0deg)' })),
      state('back', style({ transform: 'rotateY(180deg)' })),
      transition('front <=> back', animate('0.6s ease-in-out'))
    ])
  ]
})
export class CardProveedoresComponent {
  empresa = input<Empresa | null>();
  flip: 'front' | 'back' = 'front';

  toggleFlip() {
    this.flip = this.flip === 'front' ? 'back' : 'front';
  }

  productos = signal<ProductoEmpresa[]>([]);


  constructor() {
    effect(() => {

      const productos = this.empresa()?.productos || [];
      this.productos.set(productos);

    });
  }



  verTexto = computed(() => {
    const empresa = this.empresa();
    if (!empresa?.descripcion) return false;
    return empresa.descripcion.length > 80
      ? empresa.descripcion.slice(0, 80) + '...'
      : empresa.descripcion;

  });
}
