import { Component, computed, inject } from '@angular/core';
import { CountdownServiceService } from '../Services/countdown-service.service';

@Component({
  selector: 'app-card-actividades-novia',
  imports: [],
  templateUrl: './card-actividades-novia.component.html',
  styleUrl: './card-actividades-novia.component.scss',
})
export class CardActividadesNoviaComponent {
  countdownService = inject(CountdownServiceService);

  ngOnInit() {
    this.countdownService.cargarBodaDelUsuario();
  }

  ngOnDestroy() {
    this.countdownService.stopCountdown();
  }

  bodaEncontrada = computed(() => this.countdownService.bodaEncontrada());
  fechaCountdown = computed(() => this.countdownService.countdownValue());
  fechaFormateada = computed(() => this.countdownService.fechaFormateada());

  formatearNombrePareja(nombre: string | null | undefined): string {
    if (!nombre) return 'Nuestra Boda';

    const palabras = nombre
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1));

    const primerasDos = palabras.slice(0, 2).join(' ');
    return primerasDos || 'Nuestra Boda';
  }
}
