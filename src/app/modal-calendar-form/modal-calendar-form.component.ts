import { Component, computed, effect, inject, input, OnChanges, output, signal, SimpleChanges } from '@angular/core';
import { CalendarSelection, ReservaEvent, ReservaFormValue, SaveReservaPayload, tipo_reserva } from '../Interfaces/Reserva';
import Swal from 'sweetalert2'
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { EmpresasApiServiceService } from '../Services/Empresas/empresas-api-service.service';
import { Producto } from '../Interfaces/Producto';

@Component({
  selector: 'app-modal-calendar-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTimepickerModule,
    MatDatepickerModule,
    FormsModule,
  ],
  templateUrl: './modal-calendar-form.component.html',
  styleUrl: './modal-calendar-form.component.scss'
})
export class ModalCalendarFormComponent {

  private reservaAnterior: 'producto' | 'servicio' | 'bloqueo' | null = null;
  private ignorarCambioModalidad = false;
  private destruido = false;
  private inicializadoCreate = false;
  private inicializadoEdit = false;
  private reservaInicial: 'producto' | 'servicio' | 'bloqueo' | null = null;

  data = input<CalendarSelection>();
  event = input<ReservaEvent | null>(null);
  guardarReserva = output<SaveReservaPayload>();
  cerrar = output<void>();
  mode = input<'create' | 'view' | 'edit'>();
  editar = output<void>();
  empresaCtx = inject(EmpresasApiServiceService);
  empresaId = localStorage.getItem('idEmpresa')!

  productosEmpresa = signal<Producto[] | []>([]);
  tipoReservaActual = signal<string | null>(null);




  form = new FormGroup({
     productoSeleccionado: new FormControl<number | null>(null),
    titulo: new FormControl<string>('', Validators.required),
    fecha: new FormGroup({
      start: new FormControl<string>('', Validators.required),
      end: new FormControl<string | null>(null),
      startStr: new FormControl<string | null>(null),
      endStr: new FormControl<string | null>(null),
    }),
    tipo_reserva: new FormControl<'producto' | 'servicio' | 'bloqueo' | null>(null, Validators.required),
    estado: new FormControl<'pendiente' | 'confirmada' | 'cancelada' | 'bloqueada' | 'rechazada'>('pendiente', Validators.required),
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


  ngOnDestroy() {
    this.destruido = true;
    Swal.close();
  }
  constructor() {

    // EDIT MODE
    effect(() => {
      const ev = this.event();
      const mode = this.mode();

      if (!ev || mode !== 'edit') return;

      if (this.inicializadoEdit) return;

      const tipo = ev.extendedProps?.tipo_reserva ?? null;

      this.ignorarCambioModalidad = true;

      this.form.patchValue({
        titulo: ev.title,
        tipo_reserva: tipo,
        fecha: {
          start: ev.start.split('T')[0],
          end: ev.end ? ev.end.split('T')[0] : ev.start.split('T')[0],
          startStr: tipo === 'servicio'
            ? ev.start.split('T')[1]?.substring(0, 5) ?? null
            : null,
          endStr: tipo === 'servicio'
            ? ev.end?.split('T')[1]?.substring(0, 5) ?? null
            : null,
        },
        estado: ev.extendedProps?.estado || 'pendiente',
        notas: ev.extendedProps?.notas || ''
      }, { emitEvent: false });

      this.reservaAnterior = tipo;

      this.ignorarCambioModalidad = false;

      this.inicializadoEdit = true;
    });


    effect(() => {
      const selection = this.data();
      const mode = this.mode();

      if (!selection || mode !== 'create') return;

      if (this.inicializadoCreate) return;

      const start = new Date(selection.start);
      const end = selection.end
        ? new Date(selection.end)
        : new Date(selection.start);

      const fInicio = start.toISOString().split('T')[0];
      const fFin = end.toISOString().split('T')[0];

      this.ignorarCambioModalidad = true;

      this.form.patchValue({
        titulo: '',
        tipo_reserva: null,
        fecha: {
          start: fInicio,
          end: fFin,
          startStr: null,
          endStr: null
        },
        estado: 'pendiente',
        notas: ''
      }, { emitEvent: false });

      this.reservaAnterior = null;
      this.ignorarCambioModalidad = false;

      this.inicializadoCreate = true;
    });

  }

ngOnInit() {
  this.getProductos(Number(this.empresaId));

  this.fechaGroup.get('start')?.valueChanges.subscribe(val => {
    if (this.form.get('tipo_reserva')?.value === 'bloqueo') {
      this.fechaGroup.get('end')?.setValue(val, { emitEvent: false });
    }
  });

  this.form.get('tipo_reserva')?.valueChanges.subscribe(tipo => {
    this.tipoReservaActual.set(tipo);
    this.form.get('productoSeleccionado')?.setValue(null, { emitEvent: false });
    this.gestionarCambioModalidad(tipo);
  });

  this.form.valueChanges.subscribe(value => console.log('value:', value));
  this.form.statusChanges.subscribe(status => console.log('status:', status, this.form.errors));
}

  private gestionarCambioModalidad(tipo_reserva: 'producto' | 'servicio' | 'bloqueo' | null) {
    if (this.ignorarCambioModalidad) return;

    const anterior = this.reservaAnterior;
    if (tipo_reserva === anterior) return;

    if (anterior !== null) {
      Swal.fire({
        title: '¿Cambiar tipo_reserva?',
        text: 'Se ajustarán los campos de fecha y hora según la nueva tipo_reserva.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cambiar',
        cancelButtonText: 'Mantener actual'
      }).then(result => {
        if (this.destruido) return;
        this.ignorarCambioModalidad = true;
        if (result.isConfirmed) {
          this.reservaAnterior = tipo_reserva;
          this.aplicarReglasModalidad(tipo_reserva);
        } else {
          this.form.get('tipo_reserva')?.setValue(anterior, { emitEvent: false });
        }
        this.ignorarCambioModalidad = false;
      });
    } else {
      this.reservaAnterior = tipo_reserva ?? null;
      this.aplicarReglasModalidad(tipo_reserva);
    }
  }


  productosFiltrados = computed(() => {
    const tipo = this.tipoReservaActual();
    if (tipo !== 'producto' && tipo !== 'servicio') return [];
    return this.productosEmpresa().filter(p => p.tipo_producto.modalidad === tipo);
  });

  hayProductosDelTipo = computed(() => {
    const tipo = this.tipoReservaActual();
    if (tipo !== 'producto' && tipo !== 'servicio') return true;
    return this.productosEmpresa().some(p => p.tipo_producto.modalidad === tipo);
  });

  tieneProductosModalidad(modalidad: 'producto' | 'servicio'): boolean {
    return this.productosEmpresa().some(p => p.tipo_producto?.modalidad === modalidad);
  }

  sinProductosModalidad(modalidad: 'producto' | 'servicio'): boolean {
    return !this.tieneProductosModalidad(modalidad);
  }



  private aplicarReglasModalidad(tipo_reserva: string | null) {
    const fecha = this.fechaGroup;
    fecha.get('start')?.setErrors(null);
    fecha.get('end')?.setErrors(null);
    fecha.get('startStr')?.setErrors(null);
    fecha.get('endStr')?.setErrors(null);

    if (tipo_reserva === 'producto' || tipo_reserva === 'bloqueo') {
      fecha.patchValue({ startStr: null, endStr: null }, { emitEvent: false });
    }

    if (tipo_reserva === 'servicio') {
      const start = fecha.get('start')?.value;
      fecha.patchValue({ end: start }, { emitEvent: false });
    }

    this.form.updateValueAndValidity();
  }

  fechasValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const form = control as FormGroup;
      const tipo_reserva = form.get('tipo_reserva')?.value;
      const fecha = form.get('fecha') as FormGroup;
      if (!fecha) return null;

      const inicio = fecha.get('start')?.value;
      const fin = fecha.get('end')?.value;
      const hInicio = fecha.get('startStr')?.value;
      const hFin = fecha.get('endStr')?.value;
      if (!inicio) return null;

      // PRODUCTO / BLOQUEO
      if (tipo_reserva === 'producto' || tipo_reserva === 'bloqueo') {
        const dInicio = Number(inicio.replace(/-/g, ''));
        const dFin = fin ? Number(fin.replace(/-/g, '')) : dInicio;
        if (dFin < dInicio) return { fechaFinInvalida: true };
      }

      // SERVICIO
      if (tipo_reserva === 'servicio') {
        if (!hInicio || !hFin) return { horaInvalida: true };
        const [h1, m1] = hInicio.split(':').map(Number);
        const [h2, m2] = hFin.split(':').map(Number);
        if ((h2 * 60 + m2) <= (h1 * 60 + m1)) return { horaInvalida: true };
        if (fin !== inicio) fecha.get('end')?.setValue(inicio, { emitEvent: false });
      }

      return null;
    };
  }

  private getProductos(idEmpresa: number): void {
    console.log(idEmpresa);
    this.empresaCtx.getEmpresaProductos(idEmpresa).subscribe({
      next: (info) => {
        this.productosEmpresa.set(info?.data ?? []);
        console.log('Productos:', this.productosEmpresa());
      },
      error: (error: Error) => {
        this.productosEmpresa.set([]);
        console.error(error);
      },
    });
  }

  estadoNotasValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const estado = control.get('estado')?.value;
      const notas = control.get('notas')?.value;
      if (estado === 'cancelada' && (!notas || notas.length < 10)) return { notasCancelacionInvalidas: true };
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
      empresa_id: localStorage.getItem('idEmpresa')!
    });
  }

  cerrarModal() {

    this.ignorarCambioModalidad = true;

    Swal.close();

    this.form.reset({
      estado: 'pendiente',
      fecha: { start: '', end: null },
      tipo_reserva: null,
      productoSeleccionado: null
    }, { emitEvent: false });

    this.reservaAnterior = null;
    this.reservaInicial = null;
    this.inicializadoCreate = false;
    this.inicializadoEdit = false;
    this.ignorarCambioModalidad = false;
    this.tipoReservaActual.set(null);

    this.cerrar.emit();
  }




  edit() {
    if (!this.event()) return;
    this.editar.emit();
  }

}
