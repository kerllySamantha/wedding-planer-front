import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  CalendarSelection,
  ReservaEvent,
  ReservaFormValue,
  SaveReservaPayload,
} from '../Interfaces/Reserva';
import Swal from 'sweetalert2';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
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
  styleUrl: './modal-calendar-form.component.scss',
})
export class ModalCalendarFormComponent {
  private reservaAnterior: 'producto' | 'servicio' | 'bloqueo' | null = null;
  private ignorarCambioModalidad = false;
  private destruido = false;
  private inicializadoCreate = false;
  private inicializadoEdit = false;

  data = input<CalendarSelection>();
  event = input<ReservaEvent | null>(null);
  guardarReserva = output<SaveReservaPayload>();
  cerrar = output<void>();
  editar = output<void>();
  eliminarReserva = output<string>();
  mode = input<'create' | 'view' | 'edit'>();

  empresaCtx = inject(EmpresasApiServiceService);
  empresaId = localStorage.getItem('idEmpresa')!;

  productosEmpresa = signal<Producto[] | []>([]);
  tipoReservaActual = signal<string | null>(null);
  readonly today = new Date().toISOString().split('T')[0];

  form = new FormGroup(
    {
      productoSeleccionado: new FormControl<number | null>(null),
      titulo: new FormControl<string>('', Validators.required),
      fecha: new FormGroup({
        start: new FormControl<string>('', Validators.required),
        end: new FormControl<string | null>(null),
        startStr: new FormControl<string | null>(null),
        endStr: new FormControl<string | null>(null),
      }),
      tipo_reserva: new FormControl<'producto' | 'servicio' | 'bloqueo' | null>(
        null,
        Validators.required,
      ),
      estado: new FormControl<
        'pendiente' | 'confirmada' | 'cancelada' | 'bloqueada' | 'rechazada'
      >('bloqueada', Validators.required),
      notas: new FormControl<string>(''),
    },
    {
      validators: [
        this.fechasValidator(),
        this.estadoNotasValidator(),
        this.fechasDesdeHoyValidator(),
      ],
    },
  );

  get fechaGroup(): FormGroup {
    return this.form.get('fecha') as FormGroup;
  }

  productosFiltrados = computed(() => {
    const tipo = this.tipoReservaActual();
    if (tipo !== 'producto' && tipo !== 'servicio') return [];

    return this.productosEmpresa().filter(
      (p) => p.tipo_producto.modalidad === tipo,
    );
  });

  hayProductosDelTipo = computed(() => {
    const tipo = this.tipoReservaActual();
    if (tipo !== 'producto' && tipo !== 'servicio') return true;

    return this.productosEmpresa().some(
      (p) => p.tipo_producto.modalidad === tipo,
    );
  });

  constructor() {
    effect(() => {
      const ev = this.event();
      const mode = this.mode();

      if (!ev || mode !== 'edit') return;
      if (this.inicializadoEdit) return;

      const estado = ev.extendedProps?.['estado'];
      const tipo = ev.extendedProps?.['tipo_reserva'] ?? null;

      if (estado === 'confirmada') {
        this.form.disable({ emitEvent: false });
      } else {
        this.form.enable({ emitEvent: false });
      }

      this.ignorarCambioModalidad = true;

      const startDate = ev.start ? ev.start.split('T')[0] : '';
      const endRaw = ev.end ?? ev.start;
      const endDate = endRaw ? endRaw.split('T')[0] : startDate;

      this.form.patchValue(
        {
          titulo: ev.title,
          tipo_reserva: tipo,
          fecha: {
            start: startDate,
            end: endDate,
            startStr:
              tipo === 'servicio'
                ? (ev.start?.split('T')[1]?.substring(0, 5) ?? null)
                : null,
            endStr:
              tipo === 'servicio'
                ? (ev.end?.split('T')[1]?.substring(0, 5) ??
                  ev.start?.split('T')[1]?.substring(0, 5) ??
                  null)
                : null,
          },
          estado: ev.extendedProps?.['estado'] || 'bloqueada',
          notas: ev.extendedProps?.['notas'] || '',
        },
        { emitEvent: false },
      );

      this.tipoReservaActual.set(tipo);
      this.reservaAnterior = tipo;

      this.aplicarReglasModalidad(tipo);

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

      this.form.patchValue(
        {
          titulo: '',
          tipo_reserva: null,
          fecha: {
            start: fInicio,
            end: fFin,
            startStr: null,
            endStr: null,
          },
          estado: 'bloqueada',
          notas: '',
          productoSeleccionado: null,
        },
        { emitEvent: false },
      );

      this.reservaAnterior = null;
      this.tipoReservaActual.set(null);
      this.ignorarCambioModalidad = false;
      this.inicializadoCreate = true;
    });
  }

  ngOnInit(): void {
    this.getProductos(Number(this.empresaId));

    this.form.get('tipo_reserva')?.valueChanges.subscribe((tipo) => {
      this.tipoReservaActual.set(tipo);

      this.form
        .get('productoSeleccionado')
        ?.setValue(null, { emitEvent: false });

      this.gestionarCambioModalidad(tipo);
    });
  }

  ngOnDestroy(): void {
    this.destruido = true;
    Swal.close();
  }

  tieneProductosModalidad(modalidad: 'producto' | 'servicio'): boolean {
    return this.productosEmpresa().some(
      (p) => p.tipo_producto?.modalidad === modalidad,
    );
  }

  sinProductosModalidad(modalidad: 'producto' | 'servicio'): boolean {
    return !this.tieneProductosModalidad(modalidad);
  }

  private gestionarCambioModalidad(
    tipo_reserva: 'producto' | 'servicio' | 'bloqueo' | null,
  ): void {
    if (this.ignorarCambioModalidad) return;

    const anterior = this.reservaAnterior;
    if (tipo_reserva === anterior) return;

    if (anterior !== null) {
      Swal.fire({
        title: '¿Cambiar tipo de reserva?',
        text: 'Se ajustarán los campos de fecha y hora según la nueva modalidad.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cambiar',
        cancelButtonText: 'Mantener actual',
      }).then((result) => {
        if (this.destruido) return;

        this.ignorarCambioModalidad = true;

        if (result.isConfirmed) {
          this.reservaAnterior = tipo_reserva;
          this.aplicarReglasModalidad(tipo_reserva);
        } else {
          this.form
            .get('tipo_reserva')
            ?.setValue(anterior, { emitEvent: false });

          this.tipoReservaActual.set(anterior);
        }

        this.ignorarCambioModalidad = false;
      });
    } else {
      this.reservaAnterior = tipo_reserva ?? null;
      this.aplicarReglasModalidad(tipo_reserva);
    }
  }

  private aplicarReglasModalidad(tipo_reserva: string | null): void {
    const fecha = this.fechaGroup;

    const startCtrl = fecha.get('start');
    const endCtrl = fecha.get('end');
    const startStrCtrl = fecha.get('startStr');
    const endStrCtrl = fecha.get('endStr');
    const productoCtrl = this.form.get('productoSeleccionado');

    startCtrl?.setErrors(null);
    endCtrl?.setErrors(null);
    startStrCtrl?.setErrors(null);
    endStrCtrl?.setErrors(null);

    if (tipo_reserva === 'producto' || tipo_reserva === 'bloqueo') {
      startCtrl?.setValidators([Validators.required]);
      endCtrl?.setValidators([Validators.required]);
      startStrCtrl?.clearValidators();
      endStrCtrl?.clearValidators();

      fecha.patchValue({ startStr: null, endStr: null }, { emitEvent: false });
    }

    if (tipo_reserva === 'servicio') {
      startCtrl?.setValidators([Validators.required]);
      endCtrl?.clearValidators();
      startStrCtrl?.setValidators([Validators.required]);
      endStrCtrl?.setValidators([Validators.required]);

      const start = startCtrl?.value ?? null;

      fecha.patchValue(
        {
          end: start,
        },
        { emitEvent: false },
      );
    }

    if (tipo_reserva === 'producto' || tipo_reserva === 'servicio') {
      productoCtrl?.setValidators([Validators.required]);
    } else {
      productoCtrl?.clearValidators();
      productoCtrl?.setValue(null, { emitEvent: false });
    }

    startCtrl?.updateValueAndValidity({ emitEvent: false });
    endCtrl?.updateValueAndValidity({ emitEvent: false });
    startStrCtrl?.updateValueAndValidity({ emitEvent: false });
    endStrCtrl?.updateValueAndValidity({ emitEvent: false });
    productoCtrl?.updateValueAndValidity({ emitEvent: false });

    this.form.updateValueAndValidity({ emitEvent: false });

    this.form.get('tipo_reserva')?.valueChanges.subscribe((tipo) => {
      this.tipoReservaActual.set(tipo);
      this.form
        .get('productoSeleccionado')
        ?.setValue(null, { emitEvent: false });
      this.gestionarCambioModalidad(tipo);
      this.form.updateValueAndValidity();
    });
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

      if (tipo_reserva === 'producto' || tipo_reserva === 'bloqueo') {
        if (!fin) return { fechaFinRequerida: true };

        const dInicio = Number(inicio.replace(/-/g, ''));
        const dFin = Number(fin.replace(/-/g, ''));

        if (dFin < dInicio) return { fechaFinInvalida: true };
      }

      if (tipo_reserva === 'servicio') {
        if (!hInicio || !hFin) return null;

        const [h1, m1] = hInicio.split(':').map(Number);
        const [h2, m2] = hFin.split(':').map(Number);

        if (h2 * 60 + m2 <= h1 * 60 + m1) {
          return { horaInvalida: true };
        }

        if (fin !== inicio) {
          fecha.get('end')?.setValue(inicio, { emitEvent: false });
        }
      }

      return null;
    };
  }

  estadoNotasValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const estado = control.get('estado')?.value;
      const notas = control.get('notas')?.value;

      if (estado === 'cancelada' && (!notas || notas.trim().length < 10)) {
        return { notasCancelacionInvalidas: true };
      }

      return null;
    };
  }

  fechasDesdeHoyValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const tipoReserva = control.get('tipo_reserva')?.value;
      const inicio = control.get('fecha.start')?.value?.trim?.() ?? '';
      const fin = control.get('fecha.end')?.value?.trim?.() ?? '';
      const hoy = this.today;

      if (inicio && inicio < hoy) return { fechaInicioPasada: true };

      if ((tipoReserva === 'producto' || tipoReserva === 'bloqueo') && fin && fin < hoy) {
        return { fechaFinPasada: true };
      }

      return null;
    };
  }

  private getProductos(idEmpresa: number): void {
    this.empresaCtx.getEmpresaProductos(idEmpresa).subscribe({
      next: (info) => {
        this.productosEmpresa.set((info?.data ?? []) as any);
      },
      error: (error: Error) => {
        this.productosEmpresa.set([]);
        console.error(error);
      },
    });
  }

  guardar(event: Event): void {
    event.preventDefault();

    if (this.esSoloLectura()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardarReserva.emit({
      form: this.form.getRawValue() as ReservaFormValue,
      id: this.mode() === 'edit' ? this.event()?.id : undefined,
      empresa_id: localStorage.getItem('idEmpresa')!,
    });
  }

  cerrarModal(): void {
    this.form.enable({ emitEvent: false });
    this.submitted = false;
    this.ignorarCambioModalidad = true;
    Swal.close();

    this.form.reset(
      {
        estado: 'bloqueada',
        fecha: { start: '', end: null, startStr: null, endStr: null },
        tipo_reserva: null,
        productoSeleccionado: null,
        notas: '',
        titulo: '',
      },
      { emitEvent: false },
    );

    this.reservaAnterior = null;
    this.inicializadoCreate = false;
    this.inicializadoEdit = false;
    this.ignorarCambioModalidad = false;
    this.tipoReservaActual.set(null);

    this.cerrar.emit();
  }

  puedeEditarEvento(): boolean {
    const ev = this.event();
    if (!ev) return false;

    const estado = ev.extendedProps?.['estado'];

    return (
      this.mode() === 'view' &&
      estado !== 'confirmada' &&
      estado !== 'cancelada'
    );
  }

  puedeEliminarEvento(): boolean {
    const ev = this.event();
    if (!ev) return false;

    const estado = ev.extendedProps?.['estado'];

    return (
      this.mode() === 'edit' &&
      estado !== 'confirmada' &&
      estado !== 'cancelada'
    );
  }

  esSoloLectura(): boolean {
    const estado = this.event()?.extendedProps?.['estado'];
    return this.mode() === 'view' || estado === 'confirmada';
  }

  edit(): void {
    if (!this.event()) return;
    if (!this.puedeEditarEvento()) return;

    this.editar.emit();
  }

  eliminar(): void {
    const ev = this.event();
    if (!ev) return;

    const estado = ev.extendedProps?.['estado'];

    if (this.mode() !== 'edit') return;

    if (estado === 'confirmada' || estado === 'cancelada') {
      Swal.fire({
        icon: 'error',
        title: 'No permitido',
        text: 'Esta reserva no se puede eliminar.',
      });
      return;
    }

    Swal.fire({
      title: '¿Eliminar reserva?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
    }).then((result) => {
      if (this.destruido) return;
      if (!result.isConfirmed) return;

      this.eliminarReserva.emit(ev.id!);
    });
  }

  submitted = false;

  controlInvalid(path: string): boolean {
    const control = this.form.get(path);
    return !!control && control.invalid && (control.touched || this.submitted);
  }

  controlError(path: string, error: string): boolean {
    const control = this.form.get(path);
    return (
      !!control &&
      control.hasError(error) &&
      (control.touched || this.submitted)
    );
  }

  formError(error: string): boolean {
    return this.form.hasError(error) && (this.form.touched || this.submitted);
  }
}
