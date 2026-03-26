import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PedirPresupuestoService } from '../Services/PedirPresupuestos/pedir-presupuesto.service';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-aceptar-presupuesto',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './aceptar-presupuesto.component.html',
  styleUrl: './aceptar-presupuesto.component.scss'
})
export class AceptarPresupuestoComponent {

  private route = inject(ActivatedRoute);
  private presupuestoService = inject(PedirPresupuestoService);

  presupuesto = signal<any>(null);
  loading = signal(false);
  error = signal<string | null>(null);
router = inject(Router);

ngOnInit() {
  const nav = this.router.currentNavigation();
  let data = nav?.extras?.state?.['presupuesto'];

  if (!data) {
    data = history.state?.presupuesto;
  }

  if (data && data.id) {
    this.presupuesto.set(data);
  } else {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.cargarPresupuesto(id);
  }
}

 cargarPresupuesto(id: string) {
  this.loading.set(true);
  this.error.set(null); 

  this.presupuestoService.getPedirPresupuesto(id).subscribe({
    next: (res) => {
      if (!res) {
        this.error.set('Presupuesto no encontrado');
        this.presupuesto.set(null);
      } else {
        this.presupuesto.set(res);
      }

      this.loading.set(false);
    },
    error: (err) => {
      console.error(err);
      this.error.set('Error al cargar el presupuesto');
      this.loading.set(false);
    }
  });
}

  aceptar() {
    const id = this.presupuesto()?.id;
    if (!id) return;

    this.presupuestoService.aceptarPresupuesto(id).subscribe({
      next: () => {
        alert('Presupuesto aceptado');
      }
    });
  }

  rechazar() {
    const id = this.presupuesto()?.id;
    if (!id) return;

    this.presupuestoService.rechazarPresupuesto(id).subscribe({
      next: () => {
        alert('Presupuesto rechazado');
      }
    });
  }

  // 🔥 IMPORTANTE: NO mostrar estado crudo
  mapEstado(estado: string): string {
    switch (estado) {
      case 'accepted':
        return 'Aceptado';
      case 'cancelled':
        return 'Cancelado';
      case 'pending':
        return 'Pendiente';
      default:
        return 'Desconocido';
    }
  }

  // 🔥 para no usar backend raw directamente
  presupuestoFormateado = computed(() => {
    const p = this.presupuesto();
    if (!p) return null;

    return {
      ...p,
      estadoTexto: this.mapEstado(p.estado)
    };
  });
}