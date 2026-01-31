import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import * as bootstrap from 'bootstrap';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg, EventResizeDoneArg } from '@fullcalendar/interaction';
import { CalendarSelection, CreateReserva, ReservaEvent, ReservaFormValue, SaveReservaPayload } from '../Interfaces/Reserva';
import { TopBarAdminComponent } from "../top-bar-admin/top-bar-admin.component";
import { AdminNavProveedorComponent } from "../admin-nav-proveedor/admin-nav-proveedor.component";
import { ReservasServiceServiceService } from '../Services/Reservas/reservas-service-service.service';
import { DateSelectArg, EventApi, EventClickArg, EventContentArg, EventDropArg, EventMountArg } from '@fullcalendar/core/index.js';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ModalCalendarFormComponent } from "../modal-calendar-form/modal-calendar-form.component";
import { ProductoCalendario } from '../Interfaces/Producto';
import { tap } from 'rxjs';

@Component({
  selector: 'app-calendar-proveedores',
  standalone: true,
  imports: [
    CommonModule,
    FullCalendarModule,
    TopBarAdminComponent,
    AdminNavProveedorComponent,
    MatProgressSpinner,
    ModalCalendarFormComponent
  ],
  templateUrl: './calendar-proveedores.component.html',
  styleUrl: './calendar-proveedores.component.scss'
})
export class CalendarProveedoresComponent implements OnInit {


  reservasctx = inject(ReservasServiceServiceService);
  events = signal<ReservaEvent[]>([]);
  idEmpresa = computed(() => localStorage.getItem('idEmpresa')!);
  loading = signal<boolean>(false);
  modalData!: CalendarSelection;
  modalMode = signal<'create' | 'view' | 'edit' | 'create'>('create');
  selectedEvent = signal<ReservaEvent | null>(null);
  // isModalOpen = signal(false);


  mapEvent(event: EventApi): ReservaEvent {
    return {
      id: event.id,
      title: event.title,
      start: event.start?.toISOString() ?? '',
      end: event.end?.toISOString() ?? '',
      allDay: event.allDay,
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
      extendedProps: {
        estado: event.extendedProps['estado'],
        notas: event.extendedProps['notas'],
        empresa: event.extendedProps['empresa'],
        origen: event.extendedProps['origen'],
        producto: event.extendedProps['producto'],
        cliente: event.extendedProps['cliente']
      }
      ,

    };
  }


  constructor() {
    effect(() => {
      console.log(this.idEmpresa())

    });
  }


  ngOnInit(): void {
    this.getReservas();

  }

  calendarOptions = computed(() => ({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    editable: true,
    selectable: true,
    events: this.events(),
    select: this.crearReservaDesdeSeleccion.bind(this),
    dateClick: this.crearReservaRapida.bind(this),
    eventClick: this.abrirDetalleReserva.bind(this),
    eventDisplay: 'block',
    showNonCurrentDates: false,
    fixedWeekCount: false,
    displayEventTime: false,
    eventClassNames: (arg: EventContentArg) => {
      return [`estado-${arg.event.extendedProps['estado']}`];
    },
    eventDidMount: (info: EventMountArg
    ) => {
      info.el.style.backgroundColor = info.event.backgroundColor!;
      info.el.style.borderColor = info.event.borderColor!;
    }


  }));




  crearReservaDesdeSeleccion(info: DateSelectArg) {
    this.modalData = {
      start: info.start,
      end: info.end,
      allDay: info.allDay,
      startStr: info.startStr,
      endStr: info.endStr
    };

    this.modalMode.set('create');
    this.selectedEvent.set(null); // Asegurar que no hay evento previo
    this.mostrarModalBootstrap();
    // this.isModalOpen.set(true);
    // console.log(this.isModalOpen());
  }









  crearReservaRapida(info: DateClickArg) {
    console.log(info.dateStr);
  }

  abrirDetalleReserva(info: EventClickArg) {
    this.selectedEvent.set(this.mapEvent(info.event));
    this.modalMode.set('view');
    // this.isModalOpen.set(true);
    console.log(info.event._def);
    this.mostrarModalBootstrap();
  }


  eventDrop(info: EventDropArg) {
    console.log(info.event.start);
  }

  eventResize(info: EventResizeDoneArg) {
    console.log(info.event.end);
  }


  getReservas() {
    this.reservasctx.getCalendarioEmpresa(this.idEmpresa())
      .pipe(
        tap(data => {
          console.log(this.idEmpresa(), "id empresa calendario");
        })
      )
      .subscribe({

        next: (data) => {
          // this.events.set(data!);
          console.log('Sincronización de eventos:', data);
          if (data) {
            this.loading.set(true);
          }
          const eventosMapeados = data?.map(r => ({
            id: r.id,
            title: r.title,
            start: r.start,
            end: r.end,
            allDay: r.allDay,
            backgroundColor: r.backgroundColor,
            borderColor: r.borderColor,
            extendedProps: r.extendedProps
          }));


          this.events.set(eventosMapeados || []);

        },
        error: (err) => {
          console.log(err, "error al cargar reservas calendario");
        }

      })

  }


  private mostrarModalBootstrap() {
    const modalElem = document.getElementById('calendarModal');
    if (modalElem) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalElem);
      modal.show();
    }
  }

  // cerrarModal() {
  //   this.isModalOpen.set(false);
  //   this.selectedEvent.set(null);
  //   this.modalMode.set('create');
  // }

  cerrarModal() {
    const modalElem = document.getElementById('calendarModal');
    if (modalElem) {
      const modal = bootstrap.Modal.getInstance(modalElem);
      modal?.hide();
    }
    this.selectedEvent.set(null);
  }






  formToReservaEvent(form: ReservaFormValue, id?: string): ReservaEvent {

    const colores: Record<string, string> = {
      'pendiente': '#E6AF2E',
      'confirmada': '#198754',
      'bloqueada': '#6c757d',
      'cancelada': '#dc3545'
    };

    const colorAsignado = colores[form.estado] || '#E6AF2E';
    const esProducto = form.producto?.modalidad === 'producto';

    const allDay = esProducto ? true : form.fecha.allDay;

    let start = form.fecha.inicio;
    let end = form.fecha.fin;

    if (allDay) {
      const dateEnd = new Date(form.fecha.fin + 'T12:00:00');
      dateEnd.setDate(dateEnd.getDate() + 1); // El +1 necesario para FullCalendar
      end = dateEnd.toISOString().split('T')[0];
    } else {
      start = `${form.fecha.inicio}T${form.fecha.horaInicio || '00:00'}`;
      end = `${form.fecha.fin}T${form.fecha.horaFin || '00:00'}`;
    }

    return {
      id: id ?? crypto.randomUUID(),
      title: form.titulo,
      start,
      end,
      allDay: form.fecha.allDay,
      backgroundColor: colorAsignado,
      borderColor: colorAsignado,
      extendedProps: {
        estado: form.estado,
        notas: form.notas,
        fechaFin: form.fecha.fin,
        producto: form.producto
        // puedes añadir origen, cliente, empresa, boda, producto si quieres
      }
    };
  }


  guardarReserva(payload: { form: ReservaFormValue; id?: string }) {
    const { form, id } = payload;

    console.log("Intentando editar ID:", id);

    this.events.update(events => {

      const index = events.findIndex(ev => String(ev.id) === String(id));

      if (id && index !== -1) {
        const nuevosEventos = [...events];
        nuevosEventos[index] = this.formToReservaEvent(form, id);
        return nuevosEventos;

      } else {
        return [...events, this.formToReservaEvent(form)];
      }
    });

    this.cerrarModal();
  }








}
