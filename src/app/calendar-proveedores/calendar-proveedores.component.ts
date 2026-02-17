
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import * as bootstrap from 'bootstrap';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg, EventResizeDoneArg } from '@fullcalendar/interaction';
import { CalendarSelection, CreateReserva, ExtendedReservaProps, ReservaEvent, ReservaFormValue, SaveReservaPayload } from '../Interfaces/Reserva';
import { TopBarAdminComponent } from "../top-bar-admin/top-bar-admin.component";
import { AdminNavProveedorComponent } from "../admin-nav-proveedor/admin-nav-proveedor.component";
import { ReservasServiceServiceService } from '../Services/Reservas/reservas-service-service.service';
import { DateSelectArg, EventApi, EventClickArg, EventContentArg, EventDropArg, EventMountArg } from '@fullcalendar/core/index.js';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ModalCalendarFormComponent } from "../modal-calendar-form/modal-calendar-form.component";
import { ProductoCalendario } from '../Interfaces/Producto';
import { MatDialogModule } from '@angular/material/dialog';

import { tap } from 'rxjs';

@Component({
  selector: 'app-calendar-proveedores',
  standalone: true,
  imports: [
    MatDialogModule,
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
  modalMode = signal<'create' | 'view' | 'edit'>('create');
  selectedEvent = signal<ReservaEvent | null>(null);


  dialog = inject(MatDialogModule)


  ngOnInit(): void {
    this.getReservas();

  }


  constructor() {
    effect(() => {
      console.log('MODAL STATE', {
        mode: this.modalMode(),
        event: this.selectedEvent()
      });
    });

  }

  calendarOptions = computed(() => ({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    editable: true,
    headerToolbar: {
      left: 'prev,next',
      center: 'title',
      right: 'timeGridWeek,timeGridDay,dayGridMonth'
    },
    selectable: true,
    events: this.events(),
    select: this.crearReservaDesdeSeleccion.bind(this),
    // dateClick: this.crearReservaRapida.bind(this),
    eventClick: this.abrirDetalleReserva.bind(this),
    eventDisplay: 'block',
    showNonCurrentDates: false,
    fixedWeekCount: false,
    displayEventTime: false,
    selectAllow: (selectInfo: CalendarSelection) => {
      return !this.isDateBlocked(selectInfo.start, selectInfo.end);
    },

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
    this.modalData = info;
    this.modalMode.set('create');
    this.selectedEvent.set(null);
    this.mostrarModalBootstrap();
  }

  abrirDetalleReserva(info: EventClickArg) {
    const ev = info.event;

    this.selectedEvent.set({
      id: ev.id,
      title: ev.title,
      start: ev.startStr,
      end: ev.endStr,
      allDay: ev.allDay,
      extendedProps: { ...ev.extendedProps } as ExtendedReservaProps
    });

    this.modalMode.set('view'); // 👍 bien
    this.mostrarModalBootstrap();
  }


  guardarReserva(payload: { form: ReservaFormValue; id?: string }) {
    const { form, id } = payload;

    if (this.modalMode() === 'edit' && !id) {
      console.warn('Intento de edición sin ID, cancelado');
      return;
    }

    const nuevoEvento = this.formToReservaEvent(form, id);

    this.events.update(current => {
      if (id) {
        return current.map(e => e.id === id ? nuevoEvento : e);
      }
      return [...current, nuevoEvento];
    });

    this.cerrarModal();
  }



  private formToReservaEvent(form: ReservaFormValue, id?: string): ReservaEvent {
    const colores = {
      pendiente: '#E6AF2E',
      confirmada: '#198754',
      bloqueada: '#6c757d',
      cancelada: '#dc3545'
    };

    const original = id ? this.events().find(e => e.id === id) : null;

    let start: string;
    let end: string | undefined;

    // CASO A: SERVICIO (Se basa en una sola fecha, con o sin horas)
    if (form.modalidad === 'servicio') {
      if (form.fecha.allDay) {
        start = form.fecha.start; // YYYY-MM-DD
        end = undefined;          // FullCalendar entiende que es todo el día
      } else {
        start = `${form.fecha.start}T${form.fecha.startStr}`; // ISO8601
        end = `${form.fecha.start}T${form.fecha.endStr}`;
      }
    }
    // CASO B: PRODUCTO (Rango de fechas: Entrega a Recogida)
    else if (form.modalidad === 'producto') {
      start = form.fecha.start;
      // Si no hay fecha de recogida, asumimos el mismo día
      end = form.fecha.end || form.fecha.start;
    }
    // CASO C: DÍA (Bloqueo manual)
    else {
      start = form.fecha.start;
      end = form.fecha.singleDay ? undefined : form.fecha.end;
    }

    return {
      id: id ?? crypto.randomUUID(),
      title: form.titulo,
      start,
      end,
      allDay: form.fecha.allDay || form.modalidad === 'producto',
      backgroundColor: colores[form.estado],
      extendedProps: {
        ...original?.extendedProps,
        estado: form.estado,
        notas: form.notas,
        modalidad: form.modalidad
      }
    };
  }



  isDateBlocked(start: Date, end?: Date): boolean {
    return this.events().some(ev => {
      // Si el evento existente es un PRODUCTO, no bloquea el calendario
      if (ev.extendedProps?.['modalidad'] === 'producto') return false;

      const evStart = new Date(ev.start);
      const evEnd = ev.end ? new Date(ev.end) : evStart;

      return (start < evEnd && (end ?? start) > evStart);
    });
  }

  // abrirDetalleReserva2(clickInfo: any) {
  //   const event = clickInfo.event;
  //   const dialogRef = this.dialog.open(ModalCalendarFormComponent, {
  //     width: '600px',
  //     data: {
  //       mode: 'view',
  //       event: {
  //         id: event.id,
  //         title: event.title,
  //         start: event.startStr,
  //         end: event.endStr,
  //         allDay: event.allDay,
  //         extendedProps: event.extendedProps
  //       }
  //     }
  //   })

  //   dialogRef.afterClosed().subscribe(result => {
  //   if (result) {
  //     // Actualizar evento en events si fue editado
  //     this.events.update(current => current.map(e => e.id === result.id ? result : e));
  //   }
  //   });
  // }

  private mostrarModalBootstrap() {
    const modalElem = document.getElementById('calendarModal');
    if (modalElem) bootstrap.Modal.getOrCreateInstance(modalElem).show();
  }

  cerrarModal() {
    const modalElem = document.getElementById('calendarModal');
    if (modalElem) bootstrap.Modal.getInstance(modalElem)?.hide();
    this.selectedEvent.set(null);
    this.modalMode.set('create');
  }

  getReservas() {
    this.loading.set(false);
    this.reservasctx.getCalendarioEmpresa(this.idEmpresa()).subscribe(data => {
      this.events.set(data || []);
      this.loading.set(true);
    });
  }

}
