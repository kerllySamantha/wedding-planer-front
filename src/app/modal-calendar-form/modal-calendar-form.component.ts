import { Component, computed, effect, input, OnChanges, output, SimpleChanges } from '@angular/core';
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
export class ModalCalendarFormComponent implements OnChanges {





  data = input<CalendarSelection>();
  event = input<ReservaEvent | null>(null);
  guardarReserva = output<SaveReservaPayload>();
  cerrar = output<void>();
  mode = input<'create' | 'view' | 'edit'>();
  editar = output<void>();

  ngOnChanges(changes: SimpleChanges): void {

    if (this.data()) {
      console.log(this.data()
      )
    };
  }




  form = new FormGroup({
    titulo: new FormControl<string>('', Validators.required),
    fecha: new FormGroup({
      start: new FormControl<string>('', Validators.required),
      end: new FormControl<string | null>(null),
      startStr: new FormControl<string | null>(null),
      endStr: new FormControl<string | null>(null),
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
      const eventoExistente = this.event();

      if (eventoExistente && this.mode() === 'edit') {
        this.form.reset({
          titulo: eventoExistente.title,
          modalidad: eventoExistente.extendedProps.producto?.modalidad ?? null,
          fecha: {
            start: eventoExistente.start.split('T')[0],
            end: eventoExistente.end?.split('T')[0] ?? eventoExistente.start.split('T')[0],
            startStr: eventoExistente.start.includes('T')
              ? eventoExistente.start.split('T')[1].substring(0, 5)
              : '00:00',
            endStr: eventoExistente.end?.includes('T')
              ? eventoExistente.end.split('T')[1].substring(0, 5)
              : '00:00',
            allDay: eventoExistente.allDay,
            singleDay: false
          },
          estado: eventoExistente.extendedProps.estado,
          notas: eventoExistente.extendedProps.notas
        });
      }
    });


  }




  ngOnInit() {

    this.form.valueChanges.subscribe(value => {
      console.log('value:', value, this.form.value);
    });

    
    this.form.valueChanges.subscribe(value => {
      console.log('value:', value, this.form.errors);
    });





    this.form.get('modalidad')?.valueChanges.subscribe(modalidad => {
      const fecha = this.fechaGroup;
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

    this.fechaGroup.get('singleDay')?.valueChanges.subscribe(single => {
      if (single) {
        this.fechaGroup.patchValue({
          fin: this.fechaGroup.get('inicio')?.value
        }, { emitEvent: false });
      }
    });

  }


  normalizeFechas(fecha: CalendarSelection) {
    const start = fecha.start;
    const fin = fecha.end || start;
    const allDay = fecha.allDay;

    if (allDay || fecha.singleDay) {
      return { ...fecha, fin: start };
    }

    return { ...fecha, fin };
  }





  fechasValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const modalidad = control.get('modalidad')?.value;
      const fecha = control.get('fecha') as FormGroup;
      if (!fecha) return null;

      const inicio = fecha.get('start')?.value;
      let fin = fecha.get('end')?.value;
      const hInicio = fecha.get('startStr')?.value;
      const hFin = fecha.get('endStr')?.value;
      const singleDay = fecha.get('singleDay')?.value;
      const allDay = fecha.get('allDay')?.value;

      if (!inicio) return null;

      // Normalizar fin para singleDay o allDay
      if (!fin || singleDay || allDay) fin = inicio;

      // Validaciones según modalidad
      if (modalidad === 'producto' || modalidad === 'dia') {
        if (!singleDay && new Date(fin) < new Date(inicio)) {
          return { fechaFinInvalida: true };
        }
      }

      if (modalidad === 'servicio') {
        if (!hInicio || !hFin) return { horaInvalida: true };
        const start = new Date(`${inicio}T${hInicio}`);
        const end = new Date(`${inicio}T${hFin}`);
        if (end <= start) return { horaInvalida: true };
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
      id: this.mode() === 'edit' ? this.event()?.id : undefined,
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
      fecha: { start: '', end: '', allDay: false, singleDay: false }
    });

  }


  edit() {
    if (!this.event()) return;
    this.editar.emit();
  }


}
