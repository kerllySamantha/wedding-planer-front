import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import * as bootstrap from 'bootstrap';
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg, EventResizeDoneArg } from '@fullcalendar/interaction';
import { CalendarSelection, CreateReserva, ExtendedReservaProps, ReservaEvent, ReservaFormValue, SaveReservaPayload } from '../Interfaces/Reserva';
import { TopBarAdminComponent } from "../top-bar-admin/top-bar-admin.component";
import { AdminNavProveedorComponent } from "../admin-nav-proveedor/admin-nav-proveedor.component";
import { ReservasServiceServiceService } from '../Services/Reservas/reservas-service-service.service';
import { DateSelectArg, EventApi, EventClickArg, EventContentArg, EventMountArg } from '@fullcalendar/core/index.js';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ModalCalendarFormComponent } from "../modal-calendar-form/modal-calendar-form.component";
import { MatDialogModule } from '@angular/material/dialog';
@Component({
  selector: 'app-calendar-proveedores',
  standalone: true,
  imports: [
    MatDialogModule,
    FullCalendarModule,
    TopBarAdminComponent,
    AdminNavProveedorComponent,
    ModalCalendarFormComponent
  ],
  templateUrl: './calendar-proveedores.component.html',
  styleUrl: './calendar-proveedores.component.scss'
})

export class CalendarProveedoresComponent implements OnInit {

  reservasctx = inject(ReservasServiceServiceService);
  dialog = inject(MatDialogModule)

  events = signal<ReservaEvent[]>([]);
  loading = signal<boolean>(true);
  modalMode = signal<'create' | 'view' | 'edit'>('create');
  selectedEvent = signal<ReservaEvent | null>(null);

  idEmpresa = computed(() => localStorage.getItem('idEmpresa')!);

  modalData!: CalendarSelection;

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
    },


    // loading: (isLoading: boolean) => {
    //   this.loading.set(isLoading);
    // },

    viewSkeletonRender: (info: any) => {
      // Si el signal loading es true, reforzamos la clase en el DOM
      if (this.loading()) {
        info.el.classList.add('fc-skeleton-active');
      }
    },

    datesSet: (info: any) => {
      // Al terminar el renderizado de fechas, limpiamos
      setTimeout(() => {
        const calendarEl = info.el;
        calendarEl?.classList.remove('fc-skeleton-active');
      }, 300);

    }
  }))




  getReservas() {
    this.reservasctx.getCalendarioEmpresa(this.idEmpresa()).subscribe(data => {
      this.events.set(data || []);
      if (this.events()) {
        this.loading.set(false);
        console.log(this.loading());
      }

    });
  }



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
      end: ev.endStr ?? ev.startStr,
      allDay: ev.allDay,
      extendedProps: { ...ev.extendedProps } as ExtendedReservaProps
    });
    this.modalMode.set('view');
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






  isDateBlocked(start: Date, end?: Date): boolean {
    return this.events().some(ev => {
      if (ev.extendedProps?.['tipo_reserva'] === 'producto') return false;

      const evStart = new Date(ev.start);
      const evEnd = ev.end ? new Date(ev.end) : evStart;

      return (start < evEnd && (end ?? start) > evStart);
    });
  }



  cerrarModal() {
    const modalElem = document.getElementById('calendarModal');
    if (modalElem) bootstrap.Modal.getInstance(modalElem)?.hide();
    this.selectedEvent.set(null);
    this.modalMode.set('create');
  }



  private mostrarModalBootstrap() {
    const modalElem = document.getElementById('calendarModal');
    if (modalElem) bootstrap.Modal.getOrCreateInstance(modalElem).show();
  }



  private formToReservaEvent(form: ReservaFormValue, id?: string): ReservaEvent {
    const colores = {
      pendiente: '#f3c623',
      confirmada: '#28a745',
      bloqueada: '#6c757d',
      cancelada: '#170a61',
      rechazada: '#dc3545',

    };
    const original = id ? this.events().find(e => e.id === id) : null;
    let start = form.fecha.start;
    let end = form.fecha.end || form.fecha.start;
    let fechaFinVisual = form.fecha.end || form.fecha.start;
    if (form.tipo_reserva === 'servicio' && !form.fecha.allDay) {
      start = `${form.fecha.start}T${form.fecha.startStr}`;
      end = `${form.fecha.start}T${form.fecha.endStr}`;
    } else {
      fechaFinVisual = end;
      const d = new Date(end + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      end = `${y}-${m}-${day}`;
    }
    return {
      id: id ?? crypto.randomUUID(),
      title: form.titulo,
      start,
      end,
      allDay: form.fecha.allDay || form.tipo_reserva === 'producto',
      backgroundColor: colores[form.estado],
      extendedProps: {
        ...original?.extendedProps,
        estado: form.estado,
        notas: form.notas,

        tipo_reserva: form.tipo_reserva,
        fechaFinVisual: fechaFinVisual
      }
    };
  }


}
