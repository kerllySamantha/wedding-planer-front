import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  PedirPresupuestoInfo,
  ResponderPresupuestoPayload,
} from '../Interfaces/PedirPresupuesto';
import { EmpresasApiServiceService } from '../Services/Empresas/empresas-api-service.service';
import { ProductoEmpresa } from '../Interfaces/Producto';
import { PedirPresupuestoService } from '../Services/PedirPresupuestos/pedir-presupuesto.service';

/**
 * Panel del proveedor para gestionar una solicitud de presupuesto.
 *
 * Responsabilidades:
 *  1. Ver los datos de la solicitud del cliente (solo lectura).
 *  2. Responder con una propuesta formal: producto concreto, fechas, importe.
 *  3. Rechazar la solicitud con un motivo obligatorio.
 *
 * La reserva se crea automáticamente en el backend cuando el cliente acepta
 * la propuesta. Este componente NO abre ni gestiona el modal del calendario.
 */
@Component({
  selector: 'app-responder-admin-presupuesto',
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    RouterLink,
    ReactiveFormsModule,
  ],
  templateUrl: './responder-admin-presupuesto.component.html',
  styleUrl: './responder-admin-presupuesto.component.scss',
})
export class ResponderAdminPresupuestoComponent {
  protected readonly today = new Date().toISOString().split('T')[0];

  private route = inject(ActivatedRoute);
  private empresasCtx = inject(EmpresasApiServiceService);
  private pedirPresupuestoCtx = inject(PedirPresupuestoService);

  // ── Datos ────────────────────────────────────────────────────────────
  protected solicitud = signal<PedirPresupuestoInfo | null>(null);
  protected productosEmpresa = signal<ProductoEmpresa[]>([]);

  /**
   * Productos filtrados por el tipo solicitado por el cliente.
   * Si no hay coincidencia exacta, muestra todos (fallback).
   */
  protected productosFiltrados = computed(() => {
    const tipoId = this.solicitud()?.tipo_producto_id;
    if (!tipoId) return this.productosEmpresa();
    const filtrados = this.productosEmpresa().filter(
      (p) => Number(p.tipo_producto?.id) === Number(tipoId),
    );
    return filtrados.length ? filtrados : this.productosEmpresa();
  });

  /** Tipo de producto que solicitó el cliente (para mostrarlo en la vista). */
  protected tipoSolicitado = computed(() => {
    const tipoId = this.solicitud()?.tipo_producto_id;
    if (!tipoId) return null;
    const tipo = this.productosEmpresa()
      .map((p) => p.tipo_producto)
      .find((t) => t?.id === tipoId);
    return tipo
      ? { nombre: tipo.nombre, modalidad: tipo.modalidad }
      : { nombre: `Tipo #${tipoId}`, modalidad: null };
  });

  /** True si el tipo solicitado ya no existe en el catálogo del proveedor. */
  protected tipoNoDisponible = computed(() => {
    const tipoId = this.solicitud()?.tipo_producto_id;
    if (!tipoId) return false;
    return this.productosEmpresa().every((p) => p.tipo_producto?.id !== tipoId);
  });

  // ── Estado UI ────────────────────────────────────────────────────────
  protected enviandoRespuesta = signal(false);
  protected enviandoRechazo = signal(false);
  protected respuestaError = signal<string | null>(null);
  protected respuestaOk = signal<string | null>(null);

  /**
   * Resumen de la propuesta en curso, actualizado reactivamente
   * para mostrar al proveedor un preview antes de enviar.
   */
  protected resumenPropuesta = computed(() => {
    const productoId = this.respuestaForm.get('producto_id')?.value;
    const modalidad = this.respuestaForm.get('modalidad')?.value;
    if (!modalidad) return null;

    const producto = this.productosEmpresa().find((p) => p.id === productoId);
    const fechaInicio =
      this.respuestaForm.get('fecha_inicio')?.value?.trim() ?? '';
    const fechaFin = this.respuestaForm.get('fecha_fin')?.value?.trim() ?? '';
    const importe = this.respuestaForm.get('importe_ofertado')?.value ?? null;

    return {
      productoNombre: producto?.nombre || 'Producto',
      modalidad,
      fechaInicio,
      fechaFin,
      importe,
    };
  });

  // ── Formulario de propuesta ──────────────────────────────────────────
  respuestaForm = new FormGroup(
    {
      producto_id: new FormControl<number | null>(null, Validators.required),
      modalidad: new FormControl<'servicio' | 'producto' | 'dia'>(
        'servicio',
        Validators.required,
      ),
      fecha_inicio: new FormControl<string>('', Validators.required),
      hora_inicio: new FormControl<string>(''),
      fecha_fin: new FormControl<string>(''),
      hora_fin: new FormControl<string>(''),
      importe_ofertado: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(0),
      ]),
      comentario_empresa: new FormControl<string>('', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(500),
      ]),
    },
    { validators: [this.fechasValidator(), this.importeValidator()] },
  );

  // ── Formulario de rechazo ────────────────────────────────────────────
  // Absorbe la gestión que antes no existía: el proveedor puede rechazar
  // una solicitud indicando el motivo, en lugar de simplemente ignorarla.
  rechazoForm = new FormGroup({
    motivo_rechazo: new FormControl<string>('', [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(500),
    ]),
  });

  mostrarFormRechazo = signal(false);

  // ── Resolver ─────────────────────────────────────────────────────────
  private pedirPresupuestoRoute = toSignal(
    this.route.data.pipe(
      map((data) => {
        const solicitud = data['solicitud'] as
          | PedirPresupuestoInfo
          | { data?: PedirPresupuestoInfo }
          | null
          | undefined;
        return (
          (solicitud as { data?: PedirPresupuestoInfo } | null)?.data ??
          (solicitud as PedirPresupuestoInfo | null) ??
          null
        );
      }),
    ),
    { initialValue: null },
  );

  constructor() {
    effect(() => {
      const data = this.pedirPresupuestoRoute();
      if (data) {
        this.solicitud.set(data);
        this.cargarProductosEmpresa();
      }
    });

    // Al cambiar el producto seleccionado, limpiar fechas para forzar
    // al proveedor a introducir fechas coherentes con el nuevo producto.
    this.respuestaForm
      .get('producto_id')
      ?.valueChanges.subscribe((productoId) => {
        const modalidad = this.modalidadDelProducto(productoId) ?? 'servicio';
        this.respuestaForm.patchValue(
          {
            modalidad,
            fecha_inicio: '',
            hora_inicio: '',
            fecha_fin: '',
            hora_fin: '',
          },
          { emitEvent: false },
        );
      });
  }

  // ── Helpers privados ─────────────────────────────────────────────────

  private cargarProductosEmpresa(): void {
    const empresaId =
      Number(this.solicitud()?.empresa_id) ||
      Number(localStorage.getItem('idEmpresa'));

    if (!empresaId) {
      this.productosEmpresa.set([]);
      return;
    }

    this.empresasCtx.getEmpresaProductos(empresaId).subscribe({
      next: (res) => {
        const productosDesdeEndpoint = Array.isArray(
          (res as { data?: ProductoEmpresa[] } | null)?.data,
        )
          ? ((res as { data?: ProductoEmpresa[] }).data ?? [])
          : Array.isArray(res)
            ? (res as ProductoEmpresa[])
            : [];

        if (productosDesdeEndpoint.length) {
          this.enriquecerProductosConCatalogoEmpresa(
            productosDesdeEndpoint,
            empresaId,
          );
          return;
        }

        this.cargarProductosDesdeEmpresa(empresaId);
      },
      error: () => this.cargarProductosDesdeEmpresa(empresaId),
    });
  }

  private enriquecerProductosConCatalogoEmpresa(
    productos: ProductoEmpresa[],
    empresaId: number,
  ): void {
    this.empresasCtx.getEmpresa(BigInt(empresaId)).subscribe({
      next: (empresa) => {
        const catalogo = (empresa?.productos ?? []) as ProductoEmpresa[];
        if (!catalogo.length) {
          this.productosEmpresa.set(productos);
          this.autoseleccionarProductoSegunSolicitud();
          return;
        }

        const porId = new Map(catalogo.map((p) => [Number(p.id), p]));
        const enriquecidos = productos.map((p) => {
          const completo = porId.get(Number(p.id));
          return {
            ...p,
            categoria: p.categoria ?? completo?.categoria,
            tipo_producto: p.tipo_producto ?? completo?.tipo_producto,
          } as ProductoEmpresa;
        });

        this.productosEmpresa.set(enriquecidos);
        this.autoseleccionarProductoSegunSolicitud();
      },
      error: () => {
        this.productosEmpresa.set(productos);
        this.autoseleccionarProductoSegunSolicitud();
      },
    });
  }

  private cargarProductosDesdeEmpresa(empresaId: number): void {
    this.empresasCtx.getEmpresa(BigInt(empresaId)).subscribe({
      next: (empresa) => {
        this.productosEmpresa.set(
          (empresa?.productos ?? []) as ProductoEmpresa[],
        );
        this.autoseleccionarProductoSegunSolicitud();
      },
      error: () => this.productosEmpresa.set([]),
    });
  }

  private autoseleccionarProductoSegunSolicitud(): void {
    const productos = this.productosFiltrados();
    if (!productos.length) return;
    const productoYaSeleccionado = this.respuestaForm.get('producto_id')?.value;
    if (productoYaSeleccionado) return;

    const primerProducto = productos[0];
    this.respuestaForm.patchValue(
      {
        producto_id: primerProducto.id,
        modalidad: primerProducto.tipo_producto?.modalidad ?? 'servicio',
      },
      { emitEvent: false },
    );
  }

  etiquetaProducto(
    producto: Partial<ProductoEmpresa> | null | undefined,
  ): string {
    if (!producto) return 'Producto sin datos';
    const nombre = producto.nombre ?? 'Producto';
    const tipo = producto.tipo_producto?.nombre ?? 'Tipo sin nombre';
    const modalidad = producto.tipo_producto?.modalidad ?? 'sin modalidad';
    const categoria = producto.categoria?.nombre
      ? ` · ${producto.categoria.nombre}`
      : '';
    return `${nombre} · ${tipo} (${modalidad})${categoria}`;
  }

  /** Devuelve la modalidad del producto con el id dado. */
  modalidadDelProducto(
    productoId: number | null | undefined,
  ): 'producto' | 'servicio' | null {
    if (!productoId) return null;
    return (
      this.productosEmpresa().find((p) => p.id === productoId)?.tipo_producto
        ?.modalidad ?? null
    );
  }

  /** Modalidad del producto actualmente seleccionado en el formulario. */
  get modalidadSeleccionada(): 'producto' | 'servicio' | 'dia' | null {
    return this.respuestaForm.get('modalidad')?.value ?? null;
  }

  controlInvalido(controlName: string): boolean {
    const control = this.respuestaForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  mostrarErrorFormulario(errorKey: string): boolean {
    return (
      !!this.respuestaForm.errors?.[errorKey] &&
      (this.respuestaForm.touched || this.respuestaForm.dirty)
    );
  }

  // ── Validadores ──────────────────────────────────────────────────────

  /**
   * Valida que las fechas sean coherentes según la modalidad:
   *  - producto: fecha inicio y fin obligatorias; fin >= inicio
   *  - servicio: fecha + hora inicio y fin obligatorias; fin > inicio
   */
  private fechasValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const errors: any = {};

      const modalidad = control.get('modalidad')?.value;
      const fechaInicio = control.get('fecha_inicio')?.value?.trim() ?? '';
      const horaInicio = control.get('hora_inicio')?.value?.trim() ?? '';
      const fechaFin = control.get('fecha_fin')?.value?.trim() ?? '';
      const horaFin = control.get('hora_fin')?.value?.trim() ?? '';

      if (!modalidad) return null;

      if (!fechaInicio) {
        errors.fechaInicioInvalida = true;
      }

      if (fechaInicio && fechaInicio < this.today) {
        errors.fechaPasada = true;
      }

      if (modalidad === 'servicio') {
        if (!horaInicio) {
          errors.horaInicioRequerida = true;
        }

        if (!fechaFin) {
          errors.fechaFinInvalida = true;
        }

        if (!horaFin) {
          errors.horaFinRequerida = true;
        }

        if (fechaFin && fechaFin < this.today) {
          errors.fechaPasada = true;
        }

        if (fechaInicio && horaInicio && fechaFin && horaFin) {
          const inicio = new Date(`${fechaInicio}T${horaInicio}`);
          const fin = new Date(`${fechaFin}T${horaFin}`);

          if (isNaN(inicio.getTime())) {
            errors.fechaInicioInvalida = true;
          }

          if (isNaN(fin.getTime())) {
            errors.fechaFinInvalida = true;
          }

          if (
            !isNaN(inicio.getTime()) &&
            !isNaN(fin.getTime()) &&
            fin <= inicio
          ) {
            errors.horaFinAnterior = true;
          }
        }
      }

      if (modalidad === 'producto' || modalidad === 'dia') {
        if (fechaInicio && !/^\d{4}-\d{2}-\d{2}$/.test(fechaInicio)) {
          errors.fechaInicioInvalida = true;
        }

        if (!fechaFin) {
          errors.fechaFinInvalida = true;
        }

        if (fechaFin && !/^\d{4}-\d{2}-\d{2}$/.test(fechaFin)) {
          errors.fechaFinInvalida = true;
        }

        if (fechaFin && fechaFin < this.today) {
          errors.fechaPasada = true;
        }

        if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
          errors.fechaFinAnterior = true;
        }
      }

      return Object.keys(errors).length ? errors : null;
    };
  }

  /** El importe no puede ser negativo. */
  private importeValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const importe = control.get('importe_ofertado')?.value;
      if (importe !== null && importe < 0) return { importeNegativo: true };
      return null;
    };
  }

  // ── Normalización de fechas para el backend ──────────────────────────

  private normalizarFechaProducto(
    inicio: string,
    fin: string,
  ): { inicio: string; fin: string } | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio)) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fin)) return null;

    if (fin < inicio) return null;

    return {
      inicio: `${inicio} 00:00:00`,
      fin: `${fin} 00:00:00`,
    };
  }

  private normalizarFechaServicio(
    inicio: string,
    fin: string,
  ): { inicio: string; fin: string } | null {
    const norm = (v: string): string | null => {
      const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::\d{2})?$/.exec(v);
      return m ? `${m[1]} ${m[2]}:00` : null;
    };
    const i = norm(inicio);
    const f = fin ? norm(fin) : null;
    if (!i || !f) return null;
    return { inicio: i, fin: f };
  }

  // ── Acciones ─────────────────────────────────────────────────────────

  enviarRespuesta(): void {
    this.respuestaError.set(null);
    this.respuestaOk.set(null);

    const solicitudId = this.solicitud()?.id;
    if (!solicitudId) {
      this.respuestaError.set('No se encontró la solicitud.');
      return;
    }

    if (this.respuestaForm.invalid) {
      this.respuestaForm.markAllAsTouched();
      this.respuestaError.set('Completa los campos obligatorios.');
      return;
    }

    const modalidad = this.modalidadSeleccionada;
    if (!modalidad) {
      this.respuestaError.set('Selecciona una modalidad.');
      return;
    }

    const productoId = this.respuestaForm.get('producto_id')?.value;
    if (!productoId) {
      this.respuestaError.set(
        'Debes seleccionar un producto o servicio de tu catálogo.',
      );
      return;
    }

    const fechaInicio =
      this.respuestaForm.get('fecha_inicio')?.value?.trim() ?? '';
    const horaInicio =
      this.respuestaForm.get('hora_inicio')?.value?.trim() ?? '';
    const fechaFin = this.respuestaForm.get('fecha_fin')?.value?.trim() ?? '';
    const horaFin = this.respuestaForm.get('hora_fin')?.value?.trim() ?? '';
    const inicioRaw =
      modalidad === 'servicio'
        ? `${fechaInicio} ${horaInicio}`.trim()
        : fechaInicio;
    const finRaw =
      modalidad === 'servicio' ? `${fechaFin} ${horaFin}`.trim() : fechaFin;

    const fechas =
      modalidad === 'servicio'
        ? this.normalizarFechaServicio(inicioRaw, finRaw)
        : this.normalizarFechaProducto(inicioRaw, finRaw);

    if (!fechas) {
      this.respuestaError.set(
        modalidad === 'servicio'
          ? 'Introduce fecha y hora de inicio y fin con formato válido.'
          : 'Introduce la fecha con formato válido (YYYY-MM-DD).',
      );
      return;
    }

    const payload: ResponderPresupuestoPayload = {
      producto_id: Number(productoId),
      modalidad,
      fecha_inicio: fechas.inicio,
      fecha_fin: fechas.fin || undefined,
      importe_ofertado: Number(
        this.respuestaForm.get('importe_ofertado')?.value,
      ),
      comentario_empresa:
        this.respuestaForm.get('comentario_empresa')?.value?.trim() ||
        undefined,
    };

    this.enviandoRespuesta.set(true);
    this.pedirPresupuestoCtx
      .responderPresupuesto(solicitudId, payload)
      .subscribe({
        next: () => {
          this.enviandoRespuesta.set(false);
          this.respuestaOk.set(
            'Propuesta enviada. El cliente recibirá una notificación.',
          );
        },
        error: (err) => {
          this.enviandoRespuesta.set(false);
          this.respuestaError.set(
            err?.error?.message ?? 'No se pudo enviar la propuesta.',
          );
        },
      });
  }

  /**
   * Rechaza la solicitud con un motivo.
   * El cliente recibirá una notificación con el motivo del rechazo.
   */
  rechazarSolicitud(): void {
    this.respuestaError.set(null);
    this.respuestaOk.set(null);

    if (this.rechazoForm.invalid) {
      this.rechazoForm.markAllAsTouched();
      return;
    }

    const solicitudId = this.solicitud()?.id;
    if (!solicitudId) {
      this.respuestaError.set('No se encontró la solicitud.');
      return;
    }

    const motivo = this.rechazoForm.get('motivo_rechazo')?.value?.trim() ?? '';

    this.enviandoRechazo.set(true);
    this.pedirPresupuestoCtx.rechazarPresupuesto(solicitudId).subscribe({
      next: () => {
        this.enviandoRechazo.set(false);
        this.respuestaOk.set(
          'Solicitud rechazada. El cliente ha sido notificado.',
        );
        this.mostrarFormRechazo.set(false);
      },
      error: (err) => {
        this.enviandoRechazo.set(false);
        this.respuestaError.set(
          err?.error?.message ?? 'No se pudo rechazar la solicitud.',
        );
      },
    });
  }

  toggleFormRechazo(): void {
    this.mostrarFormRechazo.update((v) => !v);
    this.rechazoForm.reset();
    this.respuestaError.set(null);
  }
}
