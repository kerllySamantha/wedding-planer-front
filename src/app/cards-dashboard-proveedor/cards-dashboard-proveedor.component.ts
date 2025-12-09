import { Component, computed, inject, LOCALE_ID, signal } from '@angular/core';
import { ReservasServiceServiceService } from '../Services/Reservas/reservas-service-service.service';
import { Reserva, Reservas } from '../Interfaces/Reserva';
import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { catchError, map, of, pipe } from 'rxjs';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { VisualizadorProveedoresCardsComponent } from "../visualizador-proveedores-cards/visualizador-proveedores-cards.component";
import { CardInfoAdminComponent } from "../card-info-admin/card-info-admin.component";
registerLocaleData(localeEs);



@Component({
  selector: 'app-cards-dashboard-proveedor',
  imports: [CommonModule, CardInfoAdminComponent],
  templateUrl: './cards-dashboard-proveedor.component.html',
  styleUrl: './cards-dashboard-proveedor.component.scss'
})
export class CardsDashboardProveedorComponent {

  reservasctx = inject(ReservasServiceServiceService)



  reservas = signal<Reserva[]>([]);
  reservasPendientes = signal<Reserva[]>([]);
  reservasCanceladas = signal<Reserva[]>([]);
  reservasCompletadas = signal<Reserva[]>([]);


  error = signal<string | null>(null);

  today = signal<Date>(new Date());

  loading = signal(true);

  

  idEmpresa = computed(() => localStorage.getItem('id'));
  ngOnInit() {
    this.cargarReservas();
  }

  cargarReservas(): void {
    this.loading.set(true);
    this.error.set(null);

    this.reservasctx.getReservaEmpresa(this.idEmpresa()!)
      .subscribe({
        next: (resp) => {

          const data = resp?.data ?? [];

          this.reservas.set(data);

          this.reservasPendientes.set(
            data.filter(r => r.estado === 'pendiente')
          );

          this.reservasCanceladas.set(
            data.filter(r => r.estado === 'cancelada')
          );

          this.reservasCompletadas.set(
            data.filter(r => r.estado === 'confirmada')
          );

          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar las reservas');
          this.loading.set(false);
        }
      });
  }



}
