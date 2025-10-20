import { CommonModule, NgClass, NgStyle } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-buscador',
  imports: [CommonModule, NgClass, NgStyle],
  templateUrl: './buscador.component.html',
  styleUrl: './buscador.component.scss'
})
export class BuscadorComponent {



  constructor(private http: HttpClient) { }

  anchoVentana = signal(window.innerWidth);
  pantallaMedium = computed(() => this.anchoVentana() <= 1180);
  fondoUrl = signal<string>('');

  urlFondo = computed(() => this.fondoUrl())



  ngOnInit() {

    this.http.get<string[]>('assets/images/boda/boda.json')
      .subscribe(imagenes => {
        const indice = Math.floor(Math.random() * imagenes.length);
        const ruta = 'assets/images/boda/' + imagenes[indice];
        this.fondoUrl.set(ruta);
        console.log('Imagen de fondo seleccionada:', ruta);
      });


    window.addEventListener('resize', () => {
      this.anchoVentana.set(window.innerWidth);
      console.log('Pantalla mediana:', this.pantallaMedium());
    });
  }


}
