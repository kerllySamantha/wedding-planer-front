import { Component, computed, effect, inject, signal } from '@angular/core';
import { CountdownServiceService } from '../Services/countdown-service.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contenedor-presupuesto',
  imports: [CommonModule],
  templateUrl: './contenedor-presupuesto.component.html',
  styleUrl: './contenedor-presupuesto.component.scss'
})
export class ContenedorPresupuestoComponent {

  countdownService = inject(CountdownServiceService);

  bodaEncontrada = computed(() => this.countdownService.bodaEncontrada());
  totalEstimado = computed(() => this.countdownService.costeEstimado());

  ngOnInit() {
    this.countdownService.cargarBodaDelUsuario();
    this.totalEstimado();
  }

  // costeEstimado(): number {
  //   const boda = this.bodaEncontrada();
  //   if (!boda || !boda.presupuestos) return 0;
  //   return boda.presupuestos.reduce((total, p) => total + p.monto_total, 0);
  // }


  constructor() {

    effect(() => {
      this.totalEstimado();

      // const boda = this.countdownService.bodaEncontrada();
      // const total = boda?.presupuestos?.reduce((acc, p) => acc + p.monto_total, 0) ?? 0;
      // this.totalEstimado.set(total);
    });
  }


}
