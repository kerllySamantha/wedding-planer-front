import { Component, effect, input, OnChanges, output, SimpleChanges } from '@angular/core';
import { CalendarSelection, ReservaEvent, ReservaFormValue, SaveReservaPayload } from '../Interfaces/Reserva';
import Swal from 'sweetalert2'
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatDatepickerModule } from '@angular/material/datepicker';


@Component({
  selector: 'app-modal-calendar-form',
  imports: [CommonModule, ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTimepickerModule,
    MatDatepickerModule,
    FormsModule,

  ],
  templateUrl: './modal-calendar-form.component.html',
  styleUrl: './modal-calendar-form.component.scss'
})
export class ModalCalendarFormComponent implements OnChanges {

  private modalidadAnterior: 'producto' | 'servicio' | 'dia' | null = null;
  private saltarConfirmacionModalidad = false;


  data = input<CalendarSelection>();

  event = input<ReservaEvent | null>(null);
  guardarReserva = output<SaveReservaPayload>();
  cerrar = output<void>();
  mode = input<'create' | 'view' | 'edit'>();
  editar = output<void>();

  ngOnChanges(changes: SimpleChanges): void {
    const selection = this.data();
   if (selection && this.mode() === 'create') {
    const fInicio = selection.startStr.split('T')[0];
    let fFin = selection.endStr ? selection.endStr.split('T')[0] : fInicio;

     if (selection.allDay && selection.endStr && fFin !== fInicio) {
       const d = new Date(fFin + 'T00:00:00');
       d.setDate(d.getDate() - 1);
       fFin = d.toISOString().split('T')[0];
    }
      this.form.patchValue({
        fecha: {
          start: fInicio,
          end: fFin,
          allDay: selection.allDay,
          startStr: selection.startStr.includes('T') ? selection.startStr.split('T')[1].substring(0, 5) : null,
          endStr: selection.endStr?.includes('T') ? selection.endStr.split('T')[1].substring(0, 5) : null
        },
        modalidad: selection.allDay ? 'producto' : 'servicio'
      });
    }
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
      const ev = this.event();
      if (!ev || this.mode() !== 'edit') return;

      const isAllDay = !!ev.allDay;

      // Usamos patchValue en lugar de reset para no destruir el estado del formulario
      // y solo si los valores son distintos a los actuales
      this.form.patchValue({
        titulo: ev.title,
        modalidad: ev.extendedProps?.modalidad || (isAllDay ? 'producto' : 'servicio'),
        fecha: {
          start: ev.start.split('T')[0],
          end: ev.end ? ev.end.split('T')[0] : ev.start.split('T')[0],
          startStr: isAllDay ? null : (ev.start.includes('T') ? ev.start.split('T')[1].substring(0, 5) : '00:00'),
          endStr: isAllDay ? null : (ev.end?.includes('T') ? ev.end.split('T')[1].substring(0, 5) : '00:00'),
          allDay: isAllDay,
          singleDay: ev.singleDay || false
        },
        estado: ev.extendedProps?.estado || 'pendiente',
        notas: ev.extendedProps?.notas || ''
      }, { emitEvent: false }); // <--- IMPORTANTE: No disparamos eventos para evitar bucles
    });
  }



  ngOnInit() {

    this.form.valueChanges.subscribe(value => {
      console.log('value:', value, this.form.value);
    });


    this.form.statusChanges.subscribe(value => {
      console.log('value:', value, this.form.errors);
    });


    // Escuchar cambios en la MODALIDAD (con SweetAlert)
    this.form.get('modalidad')?.valueChanges.subscribe(modalidad => {
      this.gestionarCambioModalidad(modalidad);
    });

    // 2. Sincronizar fin con inicio (Servicio o Día Único)
    this.fechaGroup.get('start')?.valueChanges.subscribe(val => {
      const modalidad = this.form.get('modalidad')?.value;
      const single = this.fechaGroup.get('singleDay')?.value;
      if (modalidad === 'servicio' || (modalidad === 'dia' && single)) {
        this.fechaGroup.get('end')?.setValue(val, { emitEvent: false });
      }
    });


    // 3. Switch de "Solo un día"
    this.fechaGroup.get('singleDay')?.valueChanges.subscribe(single => {
      if (single) {
        const fechaInicio = this.fechaGroup.get('start')?.value;
        this.fechaGroup.get('end')?.setValue(fechaInicio, { emitEvent: false });
      }
    });

    // 4. Limpieza de horas en Todo el día
    this.fechaGroup.get('allDay')?.valueChanges.subscribe(allDay => {
      if (allDay) {
        this.fechaGroup.patchValue({ startStr: null, endStr: null }, { emitEvent: false });
      }
    });

  }

  private gestionarCambioModalidad(modalidad: any) {
    // 1. Si es un cambio interno automático, no hacer nada
    if (this.saltarConfirmacionModalidad) {
      this.modalidadAnterior = modalidad ?? null;
      return;
    }

    const anterior = this.modalidadAnterior;

    // 2. Si hay un cambio manual y ya había algo seleccionado, preguntar
    if (anterior && modalidad && anterior !== modalidad) {
      this.saltarConfirmacionModalidad = true;

      Swal.fire({
        title: '¿Cambiar modalidad?',
        text: 'Se ajustarán los campos de fecha y hora según la nueva modalidad.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, cambiar',
        cancelButtonText: 'Mantener actual'
      }).then((result) => {
        if (result.isConfirmed) {
          this.modalidadAnterior = modalidad;
          this.aplicarReglasModalidad(modalidad);
        } else {
          // Revertir el valor en el select/radio sin disparar el evento de nuevo
          this.form.get('modalidad')?.setValue(anterior, { emitEvent: false });
        }
        this.saltarConfirmacionModalidad = false;
      });
    } else {
      // 3. Si es la primera selección, aplicar reglas directamente
      this.modalidadAnterior = modalidad ?? null;
      this.aplicarReglasModalidad(modalidad);
    }
  }

  // Método auxiliar para limpiar errores y ajustar valores según la modalidad
  private aplicarReglasModalidad(modalidad: string) {
    const fecha = this.fechaGroup;

    // Limpiamos errores de validaciones anteriores
    fecha.get('start')?.setErrors(null);
    fecha.get('end')?.setErrors(null);
    fecha.get('startStr')?.setErrors(null);
    fecha.get('endStr')?.setErrors(null);

    if (modalidad === 'producto' || modalidad === 'dia') {
      fecha.patchValue({
        allDay: true,
        startStr: null,
        endStr: null,
        // Si el fin estaba vacío, le ponemos el inicio por defecto
        end: fecha.get('end')?.value || fecha.get('start')?.value
      },);
    }
    else if (modalidad === 'servicio') {
      fecha.patchValue({
        // En servicio el fin SIEMPRE es el mismo día que el inicio
        end: fecha.get('start')?.value
      },);
    }

    // Refrescar el estado del formulario para que los validadores actúen
    this.form.updateValueAndValidity();
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
      const form = control as FormGroup;
      const modalidad = form.get('modalidad')?.value;
      const fecha = form.get('fecha') as FormGroup;
      if (!fecha) return null;

      const inicio = fecha.get('start')?.value;
      const fin = fecha.get('end')?.value;
      const hInicio = fecha.get('startStr')?.value;
      const hFin = fecha.get('endStr')?.value;
      const allDay = fecha.get('allDay')?.value;
      const singleDay = fecha.get('singleDay')?.value;

      if (!inicio) return null;

      // VALIDACIÓN PARA PRODUCTO Y DÍA (Rangos de días)
      if (modalidad === 'producto' || modalidad === 'dia') {
        if (modalidad === 'dia' && singleDay) return null;

        if (fin && inicio) {
          // Al añadir 'T00:00:00' forzamos a que no use la hora actual o UTC
          const dInicio = Number(inicio.replace(/-/g, ''));
          const dFin = Number(fin.replace(/-/g, ''));

          if (dFin < dInicio) {
            return { fechaFinInvalida: true };
          }
        }
      }

      // VALIDACIÓN PARA SERVICIO (Solo horas, ignoramos el 'end' de fecha)
      if (modalidad === 'servicio') {
        if (allDay) return null;
        // Si no hay horas, es inválido
        if (!hInicio || !hFin) return { horaInvalida: true };

        const [h1, m1] = hInicio.split(':').map(Number);
        const [h2, m2] = hFin.split(':').map(Number);
        const minutosInicio = h1 * 60 + m1;
        const minutosFin = h2 * 60 + m2;

        if (minutosFin <= minutosInicio) {
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

    // Emitimos el valor RAW (puro). Si el usuario puso "2026-02-18", eso enviamos.
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
    console.log(this.event())
    if (!this.event()) return;
    this.editar.emit();
  }


}
