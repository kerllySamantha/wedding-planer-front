import { Component, computed, effect, inject, Inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { Empresa } from '../Interfaces/Empresa';
import { CountdownServiceService } from '../Services/countdown-service.service';
import { AuthenticationService } from '../Services/Autentication/authenticationService';
import { PerfilApiServiceService } from '../Services/Perfiles/perfil-api-service.service';
import { Perfil } from '../Interfaces/Perfil';
import { PedirPresupuestoService } from '../Services/PedirPresupuestos/pedir-presupuesto.service';
import { PedirPresupuestoStore } from '../Interfaces/PedirPresupuesto';
import { EmpresasApiServiceService } from '../Services/Empresas/empresas-api-service.service';
import { Producto, Productos } from '../Interfaces/Producto';
import { TipoSimple } from '../Interfaces/Tipos';



@Component({
  selector: 'app-modal-detalles-presupuesto',
  standalone: true,
  imports: [
    MatDialogModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule
  ],
  templateUrl: './modal-detalles-presupuesto.component.html',
  styleUrl: './modal-detalles-presupuesto.component.scss',
})
export class ModalDetallesPresupuestoComponent implements OnInit {

  bodaCtx = inject(CountdownServiceService);
  authCtx = inject(AuthenticationService);
  perfilCtx = inject(PerfilApiServiceService);
  pedirPresupuestoCtx = inject(PedirPresupuestoService);
  empresaCtx = inject(EmpresasApiServiceService);

  editar = signal<boolean>(false);
  enviando = signal<boolean>(false);
  empresa = signal<Empresa | null>(null);
  productosEmpresa = signal<Producto[] | []>([])
  perfil = signal<Perfil | null>(null);

  boda = computed(() => this.bodaCtx.bodaEncontrada());
  tiposEmpresa = computed<TipoSimple[]>(() => {
    const map = new Map<number, TipoSimple>();
    this.productosEmpresa().forEach((producto) => {
      if (producto?.tipo_producto) {
        map.set(producto.tipo_producto.id, producto.tipo_producto);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  });





  private readonly dateFormatter = new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  form = new FormGroup({
    tipo_producto_id: new FormControl<number | null>(null, [Validators.required]),
    fecha: new FormControl<Date | null>(null, [Validators.required]),
    invitados: new FormControl<number>(0, [Validators.pattern(/^\d{1,4}$/)]),
    telefono: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\+?[0-9\s]{9,15}$/)],
    }),
    nombre: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[\p{L} ]+$/u)],
    }),
    email: new FormControl<string>({ value: '', disabled: true }, {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    mensaje: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(600)],
    }),
    presupuesto: new FormControl<number>(0, {
      nonNullable: true, validators: [Validators.required, Validators.max(600)],

    })
  });

  constructor(
    private dialogRef: MatDialogRef<ModalDetallesPresupuestoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { empresa?: Empresa } | null
  ) {
    this.empresa.set(this.data?.empresa ?? null);

    effect(() => {
      this.authCtx.auth();
      this.perfil();
      this.boda();
      this.rellenarFormularioDesdeContexto();
    });
  }

ngOnInit(): void {
  const usuarioId = this.authCtx.usuario_id();
  const empresaId = this.empresa()?.id;

  if (usuarioId) {
    this.getPerfilUser(usuarioId);
  }

  if (empresaId) {
    this.getProductos(empresaId); 
  } else {
    console.warn('getProductos no ejecutado: empresaId es', empresaId);
  }

  if (!this.boda()) {
    this.bodaCtx.cargarBodaDelUsuario();
  }
}

  private getPerfilUser(usuarioId: number): void {
    this.perfilCtx.getPerfilByUserId(usuarioId).subscribe({
      next: (value) => {
        this.perfil.set(value?.data ?? null);
      },
      error: () => {
        this.perfil.set(null);
      },
    });
  }

private getProductos(idEmpresa: number): void {
  console.log(idEmpresa);
  this.empresaCtx.getEmpresaProductos(idEmpresa).subscribe({
    next: (info) => {
      this.productosEmpresa.set(info?.data ?? []);
      const tipos = this.tiposEmpresa();
      if (tipos.length === 1 && !this.form.controls.tipo_producto_id.value) {
        this.form.controls.tipo_producto_id.patchValue(tipos[0].id, { emitEvent: false });
      }
      console.log('Productos:', this.productosEmpresa());
    },
    error: (error: Error) => {
      this.productosEmpresa.set([]);
      console.error(error);
    },
  });
}

  private rellenarFormularioDesdeContexto(): void {
    const auth = this.authCtx.auth();
    const perfil = this.perfil();
    const fechaBoda = this.parseFecha(this.boda()?.fecha_boda ?? null);

    this.setStringIfEmpty(this.form.controls.nombre, perfil?.usuario?.name ?? auth?.name);
    this.setStringIfEmpty(this.form.controls.email, perfil?.usuario?.email ?? auth?.email);
    this.setStringIfEmpty(this.form.controls.telefono, perfil?.telefono);
    this.setDateIfEmpty(this.form.controls.fecha, fechaBoda);

    const mensajeActual = this.form.controls.mensaje.value?.trim();
    if (!mensajeActual && fechaBoda) {
      this.form.controls.mensaje.patchValue(this.generarMensajeBase(fechaBoda), { emitEvent: false });
    }
  }

  private setStringIfEmpty(control: FormControl<string>, value: string | null | undefined): void {
    if (!value) return;
    const current = control.value?.trim();
    if (!current) {
      control.patchValue(value, { emitEvent: false });
    }
  }

  private setDateIfEmpty(control: FormControl<Date | null>, value: Date | null): void {
    if (!value) return;
    if (!control.value) {
      control.patchValue(value, { emitEvent: false });
    }
  }

  private parseFecha(value: Date | string | null | undefined): Date | null {
    if (!value) return null;

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (dateOnlyMatch) {
      const year = Number(dateOnlyMatch[1]);
      const month = Number(dateOnlyMatch[2]) - 1;
      const day = Number(dateOnlyMatch[3]);
      return new Date(year, month, day);
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private generarMensajeBase(fecha: Date): string {
    return `Hola, nos casamos el ${this.formatFecha(fecha)} y nos gustaria recibir mas informacion sobre vuestros servicios y packs. Gracias.`;
  }

  private formatFecha(fecha: Date | null): string {
    if (!fecha) return 'Sin fecha';
    return this.dateFormatter.format(fecha);
  }

  private toIsoDate(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  nombreVista(): string {
    return this.form.controls.nombre.value?.trim()
      || this.perfil()?.usuario?.name
      || this.authCtx.username()
      || 'Sin nombre';
  }

  emailVista(): string {
    return this.form.getRawValue().email?.trim()
      || this.perfil()?.usuario?.email
      || this.authCtx.auth()?.email
      || 'Sin email';
  }

  telefonoVista(): string {
    return this.form.controls.telefono.value?.trim()
      || this.perfil()?.telefono
      || 'Sin telefono';
  }

  fechaVista(): string {
    const fecha = this.form.controls.fecha.value ?? this.parseFecha(this.boda()?.fecha_boda ?? null);
    return this.formatFecha(fecha);
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  editarInfo(): void {
    this.editar.update((valorActual) => !valorActual);

    if (this.editar()) {
      this.rellenarFormularioDesdeContexto();
    }
  }

  enviarSolicitud(): void {
    if (this.form.invalid || this.enviando()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const userId = this.authCtx.usuario_id();
    const empresaId = this.empresa()?.id;
    const bodaId = this.boda()?.id;

    if (!userId || !empresaId) {
      console.error('Faltan datos obligatorios para pedir el presupuesto.');
      return;
    }

    const payload: PedirPresupuestoStore = {
      nombre: raw.nombre.trim(),
      telefono: raw.telefono.trim(),
      user_id: userId,
      empresa_id: empresaId,
      tipo_producto_id: Number(raw.tipo_producto_id),
      email: raw.email.trim(),
      mensaje: raw.mensaje.trim(),
      invitados: raw.invitados!,
      presupuesto: raw.presupuesto,

      ...(bodaId ? { boda_id: bodaId } : {}),
      ...(raw.fecha ? { fecha: this.toIsoDate(raw.fecha) } : {}),
    };

    console.log('Payload enviado desde el modal:', payload);
    this.postPedirPresupuesto(payload);
  }

  postPedirPresupuesto(pedirPresupuesto: PedirPresupuestoStore): void {
    this.enviando.set(true);

    this.pedirPresupuestoCtx.storePedirPresupuesto(pedirPresupuesto).subscribe({
      next: (value) => {
        this.enviando.set(false);
        this.dialogRef.close(value ?? pedirPresupuesto);
      },
      error: (error) => {
        this.enviando.set(false);
        console.error('Error al enviar la solicitud de presupuesto:', error);
      },
    });
  }
}
