import { CommonModule, NgStyle } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, HostListener, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicioFiltrado } from '../Services/servicioFiltrado.service';

@Component({
  selector: 'app-buscador',
  imports: [CommonModule, NgStyle, ReactiveFormsModule],
  templateUrl: './buscador.component.html',
  styleUrl: './buscador.component.scss'
})
export class BuscadorComponent {

  readonly searchControl = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(120)] });

  constructor(
    private readonly http: HttpClient,
    private readonly filtroCtx: ServicioFiltrado,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {

  }

  anchoVentana = signal(window.innerWidth);
  fondoUrl = signal<string>('');

  urlFondo = computed(() => this.fondoUrl())

  @HostListener('window:resize')
  onResize() {
    this.anchoVentana.set(window.innerWidth);
  }



  ngOnInit() {
    const searchParam = this.route.snapshot.queryParamMap.get('search') ?? '';
    this.searchControl.setValue(searchParam);
    this.aplicarBusqueda(searchParam);

    this.http.get<string[]>('assets/images/boda/boda.json')
      .subscribe(imagenes => {
        const indice = Math.floor(Math.random() * imagenes.length);
        const ruta = 'assets/images/boda/' + imagenes[indice];
        this.fondoUrl.set(ruta);
        console.log('Imagen de fondo seleccionada:', ruta);
      });


  }

  buscar(event?: Event) {
    event?.preventDefault();
    const value = this.searchControl.value.trim();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: value || null },
      queryParamsHandling: 'merge',
    });
    this.aplicarBusqueda(value);
  }

  private aplicarBusqueda(nombre: string) {
    const filtrosActuales = this.filtroCtx.filtros() ?? {
      nombre: undefined,
      direccion: undefined,
      provincia: undefined,
      poblacion: undefined,
      categoria: undefined,
      tipos: undefined,
    };

    this.filtroCtx.setFilters({
      ...filtrosActuales,
      nombre: nombre || undefined,
    });
  }


}
