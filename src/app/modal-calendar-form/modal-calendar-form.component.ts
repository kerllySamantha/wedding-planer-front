import { Component, computed, effect, input, output } from '@angular/core';
import { CalendarSelection, CreateReserva, ReservaEvent, ReservaFormValue, SaveReservaPayload } from '../Interfaces/Reserva';
import * as bootstrap from 'bootstrap';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductoCalendario } from '../Interfaces/Producto';
import { single } from 'rxjs';

@Component({
  selector: 'app-modal-calendar-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modal-calendar-form.component.html',
  styleUrl: './modal-calendar-form.component.scss'
})
export class ModalCalendarFormComponent {



  data = input<CalendarSelection>();
  event = input<ReservaEvent | null>(null);
  guardarReserva = output<SaveReservaPayload>();
  cerrar = output<void>();
  mode = input<'create' | 'view' | 'edit'>();
  editar = output<void>();




  form = new FormGroup({
    titulo: new FormControl<string>('', Validators.required),
    fecha: new FormGroup({
      inicio: new FormControl<string>('', Validators.required),
      fin: new FormControl<string | null>(null),
      horaInicio: new FormControl<string | null>(null),
      horaFin: new FormControl<string | null>(null),
      allDay: new FormControl(false),
      singleDay: new FormControl(false)
    }),
    modalidad: new FormControl<'producto' | 'servicio' | 'dia' | null>(null, Validators.required),
    estado: new FormControl<'pendiente' | 'confirmada' | 'cancelada' | 'bloqueada'>('pendiente', Validators.required),
    notas: new FormControl('')
  }, {
    validators: [
      this.fechasValidator(),
      this.estadoNotasValidator(),

    ]
  });


  get fechaGroup() {
    return this.form.get('fecha') as FormGroup;
  }



  constructor() {
    effect(() => {
      const seleccion = this.data();
      const eventoExistente = this.event();

      if (eventoExistente) {
        this.form.reset({
          titulo: eventoExistente.title,
          modalidad: eventoExistente.extendedProps.modalidad,
          fecha: {
            inicio: eventoExistente.start.split('T')[0],
            fin: eventoExistente.end?.split('T')[0] ?? eventoExistente.start.split('T')[0],
            horaInicio: eventoExistente.start.includes('T') ? eventoExistente.start.split('T')[1].substring(0, 5) : '00:00',
            horaFin: eventoExistente.end?.includes('T') ? eventoExistente.end.split('T')[1].substring(0, 5) : '00:00',
            allDay: eventoExistente.allDay,
            singleDay: false
          },
          estado: eventoExistente.extendedProps.estado,
          notas: eventoExistente.extendedProps.notas
        });
      } else if (seleccion) {
        const [fIni, hIni] = seleccion.startStr.split('T');
        const [fFin, hFin] = seleccion.endStr.split('T');
        this.form.reset({
          titulo: '',
          fecha: {
            inicio: fIni,
            fin: fFin || fIni,
            horaInicio: hIni?.substring(0, 5) ?? '00:00',
            horaFin: hFin?.substring(0, 5) ?? '00:00',
            allDay: seleccion.allDay,
            singleDay: fIni === fFin || !fFin
          },
          modalidad: null,
          estado: 'pendiente',
          notas: ''
        });
      }
    });


  }




  ngOnInit() {

    this.form.valueChanges.subscribe(() => {
      
      if (this.form.errors){
        console.log('Errores de validación:', this.form.errors);
      }
    });

    this.form.get('modalidad')?.valueChanges.subscribe(modalidad => {
      const fecha = this.form.get('fecha') as FormGroup;
      if (modalidad === 'producto' || modalidad === 'dia') {
        fecha.patchValue({
          allDay: true,
          horaInicio: null,
          horaFin: null,
          fin: fecha.get('inicio')?.value
        }, { emitEvent: false });
      } else if (modalidad === 'servicio') {
        fecha.patchValue({
          allDay: false,
          fin: fecha.get('inicio')?.value
        }, { emitEvent: false });
      }
      this.form.updateValueAndValidity();
    });

    this.form.get('fecha')?.get('singleDay')?.valueChanges.subscribe(single => {
      const fecha = this.form.get('fecha') as FormGroup;
      if (single) {
        fecha.patchValue({ fin: fecha.get('inicio')?.value }, { emitEvent: false });
      }
      this.form.updateValueAndValidity();
    });
  }








  fechasValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const modalidad = control.get('modalidad')?.value;
      const fecha = control.get('fecha') as FormGroup;
      if (!fecha) return null;

      const inicio = fecha.get('inicio')?.value;
      const fin = fecha.get('fin')?.value ?? inicio;
      const hInicio = fecha.get('horaInicio')?.value;
      const hFin = fecha.get('horaFin')?.value;
      const singleDay = fecha.get('singleDay')?.value; // <-- nuevo

      if (!inicio) return null;

      // Producto / Día (solo validar fin si NO es singleDay)
      if ((modalidad === 'producto' || modalidad === 'dia') && !singleDay) {
        if (new Date(fin) < new Date(inicio)) {
          return { fechaFinInvalida: true };
        }
      }

      // Servicio: validar horas
      if (modalidad === 'servicio' && hInicio && hFin) {
        const start = new Date(`${inicio}T${hInicio}`);
        const end = new Date(`${inicio}T${hFin}`);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
          return { horaInvalida: true };
        }
      }

      return null;
    };
  }



  estadoNotasValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const estado = control.get('estado')?.value;
      const notas = control.get('notas')?.value;

      if (estado === 'cancelada' && (!notas || notas.length < 10)) {
        return { notasCancelacionInvalidas: true };
      }

      return null;
    };
  }



  guardar(event: Event) {
    event.preventDefault();


    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardarReserva.emit({
      form: this.form.getRawValue() as ReservaFormValue,
      id: this.mode() === 'edit' ? this.event()?.id : undefined
    });

  }

  // private cerrarModal() {
  //   const modalElement = document.getElementById('calendarModal');
  //   if (modalElement) {
  //     const modalInstance = bootstrap.Modal.getInstance(modalElement);
  //     if (modalInstance) {
  //       modalInstance.hide();
  //     }
  //   }
  // }

  // cerrarModal() {
  //   this.cerrar.emit();
  // }

  cerrarModal() {
    this.form.reset();

    // Emitir al padre
    this.cerrar.emit();

    this.form.reset({
      estado: 'pendiente',
      fecha: { inicio: '', fin: '', allDay: false, singleDay: false }
    });

  }


  edit() {
    const ev = this.event();
    if (!ev) return;

    const startDate = ev.start ? ev.start.split('T')[0] : '';
    const startTime = ev.start?.split('T')[1]?.substring(0, 5) || '00:00';

    let endDate = ev.end ? ev.end.split('T')[0] : startDate;
    const endTime = ev.end?.split('T')[1]?.substring(0, 5) || '00:00';

    if (ev.allDay && ev.end) {
      const d = new Date(ev.end);
      d.setDate(d.getDate() - 1);
      endDate = d.toISOString().split('T')[0];
    }

    this.form.patchValue({
      titulo: ev.title,
      fecha: {
        inicio: startDate,
        fin: endDate,
        horaInicio: startTime,
        horaFin: endTime,
        allDay: ev.allDay,
      },
      modalidad: ev.extendedProps?.['modalidad'],
      estado: ev.extendedProps?.['estado'],
      notas: ev.extendedProps?.['notas'] || ''
    });


    this.editar.emit();

  }

}
