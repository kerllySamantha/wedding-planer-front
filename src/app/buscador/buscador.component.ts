import { CommonModule, NgClass, NgStyle } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, effect, HostListener, signal } from '@angular/core';

@Component({
  selector: 'app-buscador',
  imports: [CommonModule, NgStyle],
  templateUrl: './buscador.component.html',
  styleUrl: './buscador.component.scss'
})
export class BuscadorComponent {



  constructor(private http: HttpClient) {

  }

  anchoVentana = signal(window.innerWidth);
  fondoUrl = signal<string>('');

  urlFondo = computed(() => this.fondoUrl())

  @HostListener('window:resize')
  onResize() {
    this.anchoVentana.set(window.innerWidth);
  }



  ngOnInit() {

    this.http.get<string[]>('assets/images/boda/boda.json')
      .subscribe(imagenes => {
        const indice = Math.floor(Math.random() * imagenes.length);
        const ruta = 'assets/images/boda/' + imagenes[indice];
        this.fondoUrl.set(ruta);
        console.log('Imagen de fondo seleccionada:', ruta);
      });


  }


}
