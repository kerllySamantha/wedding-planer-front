import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import * as bootstrap from 'bootstrap';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  CalendarSelection,
  ExtendedReservaProps,
  ReservaEvent,
  ReservaFormValue,
} from '../Interfaces/Reserva';
import { ReservasServiceServiceService } from '../Services/Reservas/reservas-service-service.service';
import {
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  EventMountArg,
} from '@fullcalendar/core/index.js';
import { ModalCalendarFormComponent } from '../modal-calendar-form/modal-calendar-form.component';

@Component({
  selector: 'app-calendar-proveedores',
  standalone: true,
  imports: [FullCalendarModule, ModalCalendarFormComponent],
  templateUrl: './calendar-proveedores.component.html',
  styleUrl: './calendar-proveedores.component.scss',
})
export class CalendarProveedoresComponent implements OnInit {
  reservasctx = inject(ReservasServiceServiceService);

  events = signal<ReservaEvent[]>([]);
  loading = signal<boolean>(true);
  modalMode = signal<'create' | 'view' | 'edit'>('create');
  selectedEvent = signal<ReservaEvent | null>(null);

  idEmpresa = computed(() => localStorage.getItem('idEmpresa')!);
  todayStr = computed(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
  });

  modalData!: CalendarSelection;

  ngOnInit(): void {
    this.getReservas();
  }

  constructor() {
    effect(() => {
      console.log('MODAL STATE', {
        mode: this.modalMode(),
        event: this.selectedEvent(),
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
      right: 'timeGridWeek,timeGridDay,dayGridMonth',
    },
    selectable: true,
    events: this.events(),

    select: this.crearReservaDesdeSeleccion.bind(this),
    eventClick: this.abrirDetalleReserva.bind(this),
    eventDisplay: 'block',
    showNonCurrentDates: false,
    validRange: { start: this.todayStr() },
    fixedWeekCount: false,
    displayEventTime: true,

    eventTimeFormat: {
      hour: '2-digit' as const,
      minute: '2-digit' as const,
      hour12: false,
    },

    selectAllow: (selectInfo: CalendarSelection) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectInfo.start < today) return false;
      return !this.isDateBlocked(selectInfo.start, selectInfo.end);
    },

    eventClassNames: (arg: EventContentArg) => {
      return [`estado-${arg.event.extendedProps['estado']}`];
    },

    eventDidMount: (info: EventMountArg) => {
      info.el.style.backgroundColor = info.event.backgroundColor!;
      info.el.style.borderColor = info.event.borderColor!;
    },

    datesSet: (info: any) => {
      setTimeout(() => {
        const calendarEl = info.el;
        calendarEl?.classList.remove('fc-skeleton-active');
      }, 300);
    },
  }));

  getReservas() {
    this.loading.set(true);

    this.reservasctx.getCalendarioEmpresa(this.idEmpresa()).subscribe({
      next: (data) => {
        const eventos = (data || []).map((ev: any) =>
          this.normalizarEventoCalendario(ev),
        );

        this.events.set(eventos);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.events.set([]);
        this.loading.set(false);
      },
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
      backgroundColor: ev.backgroundColor,
      borderColor: ev.borderColor,
      extendedProps: { ...ev.extendedProps } as ExtendedReservaProps,
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
    this.events.update((current) => {
      if (id) {
        return current.map((e) => (e.id === id ? nuevoEvento : e));
      }
      return [...current, nuevoEvento];
    });

    this.cerrarModal();
  }

  isDateBlocked(start: Date, end?: Date): boolean {
    return this.events().some((ev) => {
      const tipo = ev.extendedProps?.['tipo_reserva'];
      const estado = ev.extendedProps?.['estado'];

      if (!['bloqueada', 'confirmada'].includes(estado)) return false;

      const evStart = new Date(ev.start);
      const evEnd = ev.end ? new Date(ev.end) : evStart;

      if (tipo === 'servicio') {
        return start < evEnd && (end ?? start) > evStart;
      }

      const startDay = new Date(start);
      startDay.setHours(0, 0, 0, 0);
      const endDay = new Date(end ?? start);
      endDay.setHours(23, 59, 59, 999);

      return startDay < evEnd && endDay > evStart;
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

  private renderEventContent(arg: EventContentArg) {
    const tipo = arg.event.extendedProps['tipo_reserva'];
    const timeText = tipo === 'servicio' ? arg.timeText : '';
    const badge =
      tipo === 'servicio'
        ? 'Servicio'
        : tipo === 'producto'
          ? 'Producto'
          : 'Bloqueo';

    return {
      html: `
        <div class="evento-reserva evento-reserva--${tipo}">
          <div class="evento-reserva__top">
            <span class="evento-reserva__badge">${badge}</span>
            ${timeText ? `<span class="evento-reserva__time">${timeText}</span>` : ''}
          </div>
          <div class="evento-reserva__title">${arg.event.title}</div>
        </div>
      `,
    };
  }

  private buildTooltipText(
    title: string,
    tipo: string,
    start: string,
    end?: string | null,
  ): string {
    if (tipo === 'servicio') {
      const horaInicio = start.includes('T')
        ? start.split('T')[1]?.slice(0, 5)
        : '';
      const horaFin =
        end && end.includes('T') ? end.split('T')[1]?.slice(0, 5) : '';
      return `${title} · Servicio${horaInicio ? ` · ${horaInicio}` : ''}${horaFin ? ` - ${horaFin}` : ''}`;
    }

    return `${title} · ${tipo === 'producto' ? 'Producto' : 'Bloqueo por fechas'}`;
  }

  private normalizarEventoCalendario(ev: any): ReservaEvent {
    const tipo =
      ev?.extendedProps?.tipo_reserva ?? ev?.tipo_reserva ?? 'bloqueo';
    const estado = ev?.extendedProps?.estado ?? ev?.estado ?? 'bloqueada';
    const titulo = ev?.title ?? ev?.titulo ?? 'Reserva';
    const start = ev?.start ?? ev?.fecha_inicio;
    const rawEnd = ev?.end ?? ev?.fecha_fin ?? start;
    const colores: Record<string, string> = {
      pendiente: '#f3c623',
      confirmada: '#28a745',
      bloqueada: '#6c757d',
      cancelada: '#170a61',
      rechazada: '#dc3545',
    };

    const esServicio = tipo === 'servicio';
    const startNormalizado = start;
    const endNormalizado = esServicio ? rawEnd : this.toExclusiveDate(rawEnd);
    const fechaFinVisual = esServicio
      ? (rawEnd ?? start)
      : this.toDateOnly(rawEnd ?? start);

    return {
      ...ev,
      id: String(ev?.id ?? crypto.randomUUID()),
      title: titulo,
      start: startNormalizado,
      end: endNormalizado,
      allDay: !esServicio,
      backgroundColor: ev?.backgroundColor ?? colores[estado],
      borderColor: ev?.borderColor ?? colores[estado],
      extendedProps: {
        ...(ev?.extendedProps ?? {}),
        estado,
        tipo_reserva: tipo,
        fechaFinVisual,
      },
    };
  }

  private generarIdTemporal(): string {
    const c = globalThis.crypto;

    if (c?.randomUUID) {
      return c.randomUUID();
    }

    // fallback seguro y compatible
    if (c?.getRandomValues) {
      const bytes = new Uint8Array(16);
      c.getRandomValues(bytes);

      bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC 4122

      const hex = Array.from(bytes, (b) =>
        b.toString(16).padStart(2, '0'),
      ).join('');
      return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20, 32),
      ].join('-');
    }

    // último fallback
    return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  private formToReservaEvent(
    form: ReservaFormValue,
    id?: string,
  ): ReservaEvent {
    const colores: Record<string, string> = {
      pendiente: '#f3c623',
      confirmada: '#28a745',
      bloqueada: '#6c757d',
      cancelada: '#170a61',
      rechazada: '#dc3545',
    };

    const original = id ? this.events().find((e) => e.id === id) : null;
    const esServicio = form.tipo_reserva === 'servicio';

    let start = form.fecha.start;
    let end = form.fecha.end || form.fecha.start;
    let fechaFinVisual = form.fecha.end || form.fecha.start;

    if (esServicio && !form.fecha.allDay) {
      start = `${form.fecha.start}T${form.fecha.startStr}`;
      end = `${form.fecha.start}T${form.fecha.endStr}`;
      fechaFinVisual = form.fecha.start;
    } else {
      fechaFinVisual = end;
      end = this.toExclusiveDate(end);
    }

    return {
      id: id ?? this.generarIdTemporal(),
      title: form.titulo,
      start,
      end,
      allDay: !esServicio,
      backgroundColor: colores[form.estado],
      borderColor: colores[form.estado],
      extendedProps: {
        ...original?.extendedProps,
        estado: form.estado,
        notas: form.notas,
        tipo_reserva: form.tipo_reserva,
        fechaFinVisual,
      },
    };
  }

  private toExclusiveDate(dateValue: string): string {
    const base = this.toDateOnly(dateValue);
    const d = new Date(`${base}T00:00:00`);
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private toDateOnly(value: string): string {
    return value.includes('T') ? value.split('T')[0] : value;
  }

  eliminarReserva(id: string) {
    const actual = this.events().find((e) => e.id === id);
    if (!actual) return;

    const estado = actual.extendedProps?.['estado'];
    if (estado === 'confirmada') return;

    this.events.update((events) => events.filter((e) => e.id !== id));
    this.cerrarModal();
  }
}
