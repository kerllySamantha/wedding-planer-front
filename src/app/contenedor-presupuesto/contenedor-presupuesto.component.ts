import { Component, computed, inject } from '@angular/core';
import { CountdownServiceService } from '../Services/countdown-service.service';

@Component({
  selector: 'app-contenedor-presupuesto',
  imports: [],
  templateUrl: './contenedor-presupuesto.component.html',
  styleUrl: './contenedor-presupuesto.component.scss'
})
export class ContenedorPresupuestoComponent {

  countdownService = inject(CountdownServiceService);

  bodaEncontrada = computed(() => this.countdownService.bodaEncontrada());

  ngOnInit() {
    this.countdownService.cargarBodaDelUsuario();
  }

}
