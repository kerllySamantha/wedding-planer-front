import { Component, computed, effect, input, output } from '@angular/core';
import { CalendarSelection, CreateReserva, ReservaEvent, ReservaFormValue, SaveReservaPayload } from '../Interfaces/Reserva';
import * as bootstrap from 'bootstrap';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

      allDay: new FormControl(false)
    }),
    tipo: new FormControl<'servicio' | 'producto'>('producto', Validators.required),
    producto: new FormControl<any>(null, Validators.required),
    estado: new FormControl<'pendiente' | 'confirmada' | 'cancelada' | 'bloqueada'>('pendiente', Validators.required),
    notas: new FormControl('')
  }, { validators: [this.fechasValidator(), this.productoValidator()] });



  constructor() {
    effect(() => {
      const seleccion = this.data();
      const eventoExistente = this.event();

      if (eventoExistente) {

        this.form.patchValue({
          titulo: eventoExistente.title,
          fecha: {
            inicio: eventoExistente.start?.split('T')[0],
            fin: eventoExistente.end?.split('T')[0],
            horaInicio: eventoExistente.start?.split('T')[1]?.substring(0, 5) || '00:00',
            horaFin: eventoExistente.end?.split('T')[1]?.substring(0, 5) || '00:00',
            allDay: eventoExistente.allDay
          },
          estado: eventoExistente.extendedProps.estado,
        });

      } else if (seleccion) {
        const [fIni, hIni] = seleccion.startStr.split('T');
        const [fFin, hFin] = seleccion.endStr.split('T');

        this.form.patchValue({
          titulo: '',
          fecha: {
            inicio: fIni,
            fin: fFin || fIni,
            horaInicio: hIni ? hIni.substring(0, 5) : '00:00',
            horaFin: hFin ? hFin.substring(0, 5) : '00:00',
            allDay: seleccion.allDay
          }
        });
      }

      this.form.markAsDirty();
      console.log(this.form.errors);
    });


  }


  ngOnInit() {
    this.form.get('tipo')?.valueChanges.subscribe(tipo => {
      if (tipo === 'producto') {
        this.form.get('fecha')?.get('allDay')?.setValue(true);
        this.form.get('fecha')?.get('horaInicio')?.setValue('10:00');
        this.form.get('fecha')?.get('horaFin')?.setValue('17:00');
      }
    });
  }





  fechasValidator(): ValidatorFn {
    return (g: AbstractControl) => {
      const tipo = g.get('tipo')?.value;
      const estado = g.get('estado')?.value;
      const fecha = g.get('fecha') as FormGroup;

      if (!fecha) return null;

      if (estado === 'bloqueada') return null;

      const inicio = fecha.get('inicio')?.value;
      const fin = fecha.get('fin')?.value;
      const hIni = fecha.get('horaInicio')?.value;
      const hFin = fecha.get('horaFin')?.value;

      if (tipo === 'servicio') {
        if (!hIni || !hFin) return { horasRequeridas: true };
        return hFin <= hIni ? { horaFinInvalida: true } : null;
      }

      if (!inicio || !fin) return null;

      const start = new Date(`${inicio}T${hIni || '00:00'}`);
      const end = new Date(`${fin}T${hFin || '00:00'}`);

      return end <= start ? { fechaFinInvalida: true } : null;
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


  productoValidator(): ValidatorFn {
    return (g: AbstractControl) => {
      const tipo = g.get('tipo')?.value;
      const estado = g.get('estado')?.value;
      const producto = g.get('producto')?.value;

      if (estado === 'bloqueada') return null;

      if (tipo === 'servicio') return null;

      return producto ? null : { productoRequerido: true };
    };
  }



  guardar() {


    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // const f = this.form.getRawValue();
    // const datosEvento: ReservaFormValue = {
    //   titulo: f.titulo!,
    //   fechaInicio: f.fechaInicio!,
    //   fechaFin: f.fechaFin!,
    //   horaInicio: f.horaInicio!,
    //   horaFin: f.horaFin!,
    //   allDay: !!f.allDay!,
    //   estado: f.estado!,
    //   notas: f.notas!
    // };

    // this.guardarReserva.emit(datosEvento as any);
    this.guardarReserva.emit({
      form: this.form.getRawValue() as ReservaFormValue,
      id: this.mode() === 'edit' ? this.event()?.id : undefined
    });

    console.log('Datos del formulario a guardar:', this.form.getRawValue());


    this.cerrarModal();
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
      tipo: ev.extendedProps?.['producto']?.modalidad || 'producto', // Mapeamos modalidad
      producto: ev.extendedProps?.['producto'] || null,
      estado: ev.extendedProps?.['estado'],
      notas: ev.extendedProps?.['notas'] || ''
    });

    // 4. Cambiar el modo y notificar
    // Nota: Si 'mode' es un Signal de entrada (input), no puedes usar .set(). 
    // Deberías manejar el estado internamente o mediante el output 'editar'.
    this.editar.emit();
  }

}
