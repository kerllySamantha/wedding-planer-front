import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';

import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Reserva, ReservaEvent } from '../Interfaces/Reserva';

import { TopBarAdminComponent } from "../top-bar-admin/top-bar-admin.component";
import { AdminNavProveedorComponent } from "../admin-nav-proveedor/admin-nav-proveedor.component";
import { ReseniasApiServiceService } from '../Services/Resenias/resenias-api-service.service';
import { ReservasServiceServiceService } from '../Services/Reservas/reservas-service-service.service';

@Component({
  selector: 'app-calendar-proveedores',
  standalone: true,
  imports: [
    CommonModule,
    FullCalendarModule,
    TopBarAdminComponent,
    AdminNavProveedorComponent
  ],
  templateUrl: './calendar-proveedores.component.html',
  styleUrl: './calendar-proveedores.component.scss'
})
export class CalendarProveedoresComponent implements OnInit {


  ngOnInit(): void {
    this.getReservas();
  }

  reservasctx = inject(ReservasServiceServiceService);

  reservas = signal<ReservaEvent[]>([]);
  idEmpresa = computed(() => localStorage.getItem('id'));





  events: ReservaEvent[] = [
    {
      id: "1",
      title: "Reserva — Ana & Luis",
      start: "2025-12-12",
      backgroundColor: "#4CAF50",
      borderColor: "#4CAF50",
      estado: "confirmada",
      end: "2026-01-25"
    },
    {
      id: "2",
      title: "Reunión pendiente",
      start: "2026-01-15",
      backgroundColor: "#FFC107",
      borderColor: "#FFC107",
      estado: "pendiente",
      end: "2026-01-25"
    }
  ];

  calendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    editable: true,
    events: this.getReservas()!, // ✔ CORRECTO
    dateClick: this.crearReservaRapida.bind(this),
    eventClick: this.abrirDetalleReserva.bind(this),
  };

  crearReservaRapida(info: any) {
    alert("Crear reserva en " + info.dateStr);
  }

  abrirDetalleReserva(info: any) {
    alert("Reserva seleccionada: " + info.event.title);
  }


  getReservas() {
    this.reservasctx.getCalendarioEmpresa(this.idEmpresa()!).subscribe({
      next: (resp) => {

        const data = resp ?? [];
        this.reservas.set(data);
        console.log(this.reservas());





      },
      error: (err) => {
        console.log(err, "eror")
      }

    })

  }
}
