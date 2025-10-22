import { Component, computed, effect, inject, signal } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { ActivatedRoute, Route } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, Observable, tap } from 'rxjs';
import { Empresa } from '../Interfaces/Empresa';
import { Foto } from '../Interfaces/Resenia';
import { AsyncPipe, CommonModule } from '@angular/common';

@Component({
  selector: 'app-detalles-proveedores',
  imports: [ CommonModule, NavbarComponent],
  templateUrl: './detalles-proveedores.component.html',
  standalone: true,
  styleUrl: './detalles-proveedores.component.scss'
})
export class DetallesProveedoresComponent {

  private route = inject(ActivatedRoute);
  protected empresaId = this.route.snapshot.params['id'];

  private fotosConRatio = signal<{ foto: Foto; ratio: number }[]>([]);

  fotoPrincipal = computed(() => this.fotosOrdenadas()[0] || null);

  protected empresa = toSignal(this.route.data.pipe(
    tap(data => console.log(data['proveedor'].data)),
    map(data => data['proveedor'].data as Empresa)
  ));



  constructor() {
    effect(() => {
      const fotos = this.empresa()?.fotos || [];
      if (fotos.length > 0) {
        this.cargarRatios(fotos);
      }
    });

    
  }


 
  fotosOrdenadas = computed(() => {
    const lista = [...this.fotosConRatio()];
    
    return lista.sort((a, b) => b.ratio - a.ratio).map(f => f.foto);
  });



  private cargarRatios(fotos: Foto[]) {
    const resultados: { foto: Foto; ratio: number }[] = [];
    fotos.forEach(foto => {
      const img = new Image();
      img.src = foto.url;
      img.onload = () => {
        const ratio = img.naturalHeight / img.naturalWidth;
        resultados.push({ foto, ratio });
        if (resultados.length === fotos.length) {
          this.fotosConRatio.set(resultados);
        }
      };
   
    });
    
  }


}
  


