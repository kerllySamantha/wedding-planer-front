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
import { PedirPresupuestoInfo, ResponderPresupuestoPayload } from '../Interfaces/PedirPresupuesto';
import { EmpresasApiServiceService } from '../Services/Empresas/empresas-api-service.service';
import { ProductoEmpresa } from '../Interfaces/Producto';
import { PedirPresupuestoService } from '../Services/PedirPresupuestos/pedir-presupuesto.service';
import { CreateEmpresa, Empresa } from '../Interfaces/Empresa';

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
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink, ReactiveFormsModule],
  templateUrl: './responder-admin-presupuesto.component.html',
  styleUrl: './responder-admin-presupuesto.component.scss',
})
export class ResponderAdminPresupuestoComponent {
  protected readonly today = new Date().toISOString().split('T')[0];

  private route           = inject(ActivatedRoute);
  private empresasCtx     = inject(EmpresasApiServiceService);
  private pedirPresupuestoCtx = inject(PedirPresupuestoService);

  // ── Datos ────────────────────────────────────────────────────────────
  protected solicitud        = signal<PedirPresupuestoInfo | null>(null);
  protected productosEmpresa = signal<ProductoEmpresa[]>([]);

  /**
   * Productos filtrados por el tipo solicitado por el cliente.
   * Si no hay coincidencia exacta, muestra todos (fallback).
   */
  protected productosFiltrados = computed(() => {
    const tipoId = this.solicitud()?.tipo_producto_id;
    if (!tipoId) return this.productosEmpresa();
        const filtrados = this.productosEmpresa().filter(p => Number(p.tipo_producto?.id) === Number(tipoId));
    return filtrados.length ? filtrados : this.productosEmpresa();
  });

  /** Tipo de producto que solicitó el cliente (para mostrarlo en la vista). */
  protected tipoSolicitado = computed(() => {
    const tipoId = this.solicitud()?.tipo_producto_id;
    if (!tipoId) return null;
    const tipo = this.productosEmpresa().map(p => p.tipo_producto).find(t => t?.id === tipoId);
    return tipo ? { nombre: tipo.nombre, modalidad: tipo.modalidad }
                : { nombre: `Tipo #${tipoId}`, modalidad: null };
  });

  /** True si el tipo solicitado ya no existe en el catálogo del proveedor. */
  protected tipoNoDisponible = computed(() => {
    const tipoId = this.solicitud()?.tipo_producto_id;
    if (!tipoId) return false;
    return this.productosEmpresa().every(p => p.tipo_producto?.id !== tipoId);
  });

  // ── Estado UI ────────────────────────────────────────────────────────
  protected enviandoRespuesta = signal(false);
  protected enviandoRechazo   = signal(false);
  protected creandoProducto   = signal(false);
  protected respuestaError    = signal<string | null>(null);
  protected respuestaOk       = signal<string | null>(null);

  /**
   * Resumen de la propuesta en curso, actualizado reactivamente
   * para mostrar al proveedor un preview antes de enviar.
   */
  protected resumenPropuesta = computed(() => {
    const productoId = this.respuestaForm.get('producto_id')?.value;
    const modalidad  = this.respuestaForm.get('modalidad')?.value;
    if (!modalidad) return null;

    const producto    = this.productosEmpresa().find(p => p.id === productoId);
    const fechaInicio = this.respuestaForm.get('fecha_inicio')?.value?.trim() ?? '';
    const fechaFin    = this.respuestaForm.get('fecha_fin')?.value?.trim()    ?? '';
    const importe     = this.respuestaForm.get('importe_ofertado')?.value     ?? null;

    const nombrePersonalizado = this.respuestaForm.get('producto_personalizado_nombre')?.value?.trim();
    return { productoNombre: nombrePersonalizado || producto?.nombre || 'Producto', modalidad, fechaInicio, fechaFin, importe };
  });

  // ── Formulario de propuesta ──────────────────────────────────────────
  respuestaForm = new FormGroup(
    {
      tipo_producto_respuesta: new FormControl<'catalogo' | 'personalizado'>('catalogo', Validators.required),
      producto_id:        new FormControl<number | null>(null),
      producto_personalizado_nombre: new FormControl<string>(''),
      modalidad:          new FormControl<'servicio' | 'producto' | 'dia'>('servicio', Validators.required),
      fecha_inicio:       new FormControl<string>('',          Validators.required),
      fecha_fin:          new FormControl<string>(''),
      importe_ofertado:   new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
      comentario_empresa: new FormControl<string>(''),
    },
    { validators: [this.fechasValidator(), this.importeValidator()] }
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

  nuevoProductoForm = new FormGroup({
    nombre: new FormControl<string>('', [Validators.required, Validators.minLength(2)]),
    modalidad: new FormControl<'producto' | 'servicio'>('servicio', Validators.required),
    tipo_producto_nombre: new FormControl<string>('', [Validators.required, Validators.minLength(2)]),
    categoria_nombre: new FormControl<string>('', [Validators.required, Validators.minLength(2)]),
  });

  mostrarFormRechazo = signal(false);

  // ── Resolver ─────────────────────────────────────────────────────────
  private pedirPresupuestoRoute = toSignal(
    this.route.data.pipe(
      map(data => {
        const solicitud = data['solicitud'] as
          | PedirPresupuestoInfo
          | { data?: PedirPresupuestoInfo }
          | null
          | undefined;
        return (solicitud as { data?: PedirPresupuestoInfo } | null)?.data
          ?? (solicitud as PedirPresupuestoInfo | null)
          ?? null;
      })
    ),
    { initialValue: null }
  );

  constructor() {
    effect(() => {
      const data = this.pedirPresupuestoRoute();
      if (data) {
        this.solicitud.set(data);
        this.cargarProductosEmpresa();
        this.autocompletarTipoYCategoria();
      }
    });

    // Al cambiar el producto seleccionado, limpiar fechas para forzar
    // al proveedor a introducir fechas coherentes con el nuevo producto.
    this.respuestaForm.get('producto_id')?.valueChanges.subscribe(() => {
      this.respuestaForm.patchValue(
        { fecha_inicio: '', fecha_fin: '' },
        { emitEvent: false }
      );
    });
  }

  // ── Helpers privados ─────────────────────────────────────────────────

  private cargarProductosEmpresa(): void {
    const empresaId =
      Number(this.solicitud()?.empresa_id) ||
      Number(localStorage.getItem('idEmpresa'));

    if (!empresaId) { this.productosEmpresa.set([]); return; }

    this.empresasCtx.getEmpresaProductos(empresaId).subscribe({
      next:  res => {
        this.productosEmpresa.set((res?.data ?? []) as ProductoEmpresa[]);
        this.autocompletarTipoYCategoria();
      },
      error: ()  => this.productosEmpresa.set([]),
    });
  }

  private autocompletarTipoYCategoria(): void {
    const tipoId = this.solicitud()?.tipo_producto_id;
    if (!tipoId) return;
    const productoTipo = this.productosEmpresa().find(p => Number(p.tipo_producto?.id) === Number(tipoId));
    if (!productoTipo) return;
    this.nuevoProductoForm.patchValue({
      tipo_producto_nombre: productoTipo.tipo_producto.nombre,
      categoria_nombre: productoTipo.categoria?.nombre ?? '',
      modalidad: productoTipo.tipo_producto.modalidad,
    }, { emitEvent: false });
  }

  crearProductoServicio(): void {
    this.respuestaError.set(null);
    this.respuestaOk.set(null);
    if (this.nuevoProductoForm.invalid) {
      this.nuevoProductoForm.markAllAsTouched();
      return;
    }

    const empresaId = Number(this.solicitud()?.empresa_id) || Number(localStorage.getItem('idEmpresa'));
    if (!empresaId) { this.respuestaError.set('No se encontró la empresa.'); return; }
    const raw = this.nuevoProductoForm.getRawValue();
    const nombreNuevo = raw.nombre?.trim() ?? '';
    const tipoNombre = raw.tipo_producto_nombre?.trim() ?? '';
    const categoriaNombre = raw.categoria_nombre?.trim() ?? '';
    const modalidad = raw.modalidad ?? 'servicio';

    if (!nombreNuevo || !tipoNombre || !categoriaNombre) {
      this.respuestaError.set('Completa nombre, tipo y categoría del producto/servicio.');
      return;
    }

    this.creandoProducto.set(true);
    this.empresasCtx.getEmpresa(BigInt(empresaId)).subscribe({
      next: (empresaInfo) => {
        if (!empresaInfo?.id) {
          this.creandoProducto.set(false);
          this.respuestaError.set('No se pudo cargar la empresa para guardar el producto.');
          return;
        }
        const payload = this.buildEmpresaPayloadConProducto(empresaInfo, {
          nombre: nombreNuevo,
          tipo_producto_nombre: tipoNombre,
          categoria_nombre: categoriaNombre,
        });

        this.empresasCtx.editEmpresa(String(empresaId), payload).subscribe({
          next: () => {
            this.creandoProducto.set(false);
            this.respuestaOk.set(`"${nombreNuevo}" añadido como ${modalidad}. Ya puedes seleccionarlo en la propuesta.`);
            this.nuevoProductoForm.patchValue({ nombre: '' });
            this.cargarProductosEmpresa();
          },
          error: (err) => {
            this.creandoProducto.set(false);
            this.respuestaError.set(err?.error?.message ?? 'No se pudo añadir el producto/servicio.');
          },
        });
      },
      error: () => {
        this.creandoProducto.set(false);
        this.respuestaError.set('No se pudo cargar la empresa para guardar el producto.');
      },
    });
  }

  private buildEmpresaPayloadConProducto(empresa: Empresa, nuevo: { nombre: string; tipo_producto_nombre: string; categoria_nombre: string; }): CreateEmpresa {
    const existentes: NonNullable<CreateEmpresa['productos']> = (empresa.productos ?? []).map(p => ({
      id: p.id ?? null,
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precio_max: p.precio_max ?? 0,
      precio_min: p.precio_min ?? 0,
      tipo_producto_nombre: p.tipo_producto?.nombre ?? '',
      categoria_nombre: p.categoria?.nombre ?? '',
    }));

    const yaExiste = existentes.some(p =>
      p.nombre.toLowerCase() === nuevo.nombre.toLowerCase() &&
      p.tipo_producto_nombre.toLowerCase() === nuevo.tipo_producto_nombre.toLowerCase() &&
      p.categoria_nombre.toLowerCase() === nuevo.categoria_nombre.toLowerCase()
    );
    if (!yaExiste) {
      existentes.push({
        id: null,
        nombre: nuevo.nombre,
        descripcion: '',
        precio_max: 0,
        precio_min: 0,
        tipo_producto_nombre: nuevo.tipo_producto_nombre,
        categoria_nombre: nuevo.categoria_nombre,
      });
    }

    return {
      nombre_empresa: empresa.nombre_empresa ?? '',
      tipo_servicio: empresa.tipo_servicio ?? '',
      email: empresa.usuario?.email ?? '',
      telefono: empresa.telefono ?? '',
      name: empresa.usuario?.name ?? '',
      password: '',
      poblacion_id: empresa.poblacion?.id ?? 0,
      direccion: empresa.direccion ?? '',
      descripcion: empresa.descripcion ?? '',
      logo: empresa.logo ?? '',
      productos: existentes,
    };
  }

  /** Devuelve la modalidad del producto con el id dado. */
  modalidadDelProducto(productoId: number | null | undefined): 'producto' | 'servicio' | null {
    if (!productoId) return null;
    return this.productosEmpresa().find(p => p.id === productoId)?.tipo_producto?.modalidad ?? null;
  }

  /** Modalidad del producto actualmente seleccionado en el formulario. */
  get modalidadSeleccionada(): 'producto' | 'servicio' | 'dia' | null {
    return this.respuestaForm.get('modalidad')?.value ?? null;
  }

  // ── Validadores ──────────────────────────────────────────────────────

  /**
   * Valida que las fechas sean coherentes según la modalidad:
   *  - producto: fecha inicio y fin obligatorias; fin >= inicio
   *  - servicio: fecha + hora inicio y fin obligatorias; fin > inicio
   */
  private fechasValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const modalidad    = control.get('modalidad')?.value as 'servicio' | 'producto' | 'dia' | null;
      const inicioRaw    = control.get('fecha_inicio')?.value?.trim() ?? '';
      const finRaw       = control.get('fecha_fin')?.value?.trim()    ?? '';

      if (!modalidad || !inicioRaw) return null;

      if (modalidad === 'servicio') {
        // Para servicios se espera "YYYY-MM-DD HH:mm" o "YYYY-MM-DDTHH:mm"
        const inicio = Date.parse(inicioRaw);
        const fin    = finRaw ? Date.parse(finRaw) : NaN;
        if (isNaN(inicio))        return { fechaInicioInvalida: true };
        if (!finRaw)              return { horaFinRequerida: true };
        if (isNaN(fin))           return { fechaFinInvalida: true };
        if (fin <= inicio)        return { horaFinAnterior: true };
        if (inicioRaw.slice(0, 10) < this.today || finRaw.slice(0, 10) < this.today) {
          return { fechaPasada: true };
        }
      }

      if (modalidad === 'producto' || modalidad === 'dia') {
        // Para productos se esperan fechas "YYYY-MM-DD"
        if (!/^\d{4}-\d{2}-\d{2}$/.test(inicioRaw)) return { fechaInicioInvalida: true };
        if (finRaw && !/^\d{4}-\d{2}-\d{2}$/.test(finRaw)) return { fechaFinInvalida: true };
        if (inicioRaw < this.today) return { fechaPasada: true };
        if (finRaw && finRaw < this.today) return { fechaPasada: true };
        if (finRaw && finRaw < inicioRaw) return { fechaFinAnterior: true };
      }

      return null;
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

  private normalizarFechaProducto(inicio: string, fin: string): { inicio: string; fin: string } | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio)) return null;
    const finNorm = /^\d{4}-\d{2}-\d{2}$/.test(fin) ? fin : '';
    return { inicio, fin: finNorm };
  }

  private normalizarFechaServicio(inicio: string, fin: string): { inicio: string; fin: string } | null {
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
    if (!solicitudId) { this.respuestaError.set('No se encontró la solicitud.'); return; }

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

    const tipoRespuesta = this.respuestaForm.get('tipo_producto_respuesta')?.value;
    const productoId = this.respuestaForm.get('producto_id')?.value;
    const productoPersonalizadoNombre = this.respuestaForm.get('producto_personalizado_nombre')?.value?.trim();
    if (tipoRespuesta === 'catalogo' && !productoId) {
      this.respuestaError.set('Debes indicar un producto del sistema o un nombre de producto personalizado.');
      return;
    }
    if (tipoRespuesta === 'personalizado' && !productoPersonalizadoNombre) {
      this.respuestaError.set('Debes indicar un producto del sistema o un nombre de producto personalizado.');
      return;
    }

    const inicioRaw = this.respuestaForm.get('fecha_inicio')?.value?.trim() ?? '';
    const finRaw    = this.respuestaForm.get('fecha_fin')?.value?.trim()    ?? '';

    const fechas = modalidad === 'servicio'
      ? this.normalizarFechaServicio(inicioRaw, finRaw)
      : this.normalizarFechaProducto(inicioRaw, finRaw);

    if (!fechas) {
      this.respuestaError.set(
        modalidad === 'servicio'
          ? 'Introduce fecha y hora de inicio y fin con formato válido.'
          : 'Introduce la fecha con formato válido (YYYY-MM-DD).'
      );
      return;
    }

    const payload: ResponderPresupuestoPayload = {
      producto_id:        tipoRespuesta === 'catalogo' ? Number(productoId) : undefined,
      producto_personalizado_nombre: tipoRespuesta === 'personalizado' ? productoPersonalizadoNombre : undefined,
      modalidad,
      fecha_inicio:       fechas.inicio,
      fecha_fin:          fechas.fin || undefined,
      importe_ofertado:   Number(this.respuestaForm.get('importe_ofertado')?.value),
      comentario_empresa: this.respuestaForm.get('comentario_empresa')?.value?.trim() || undefined,
    };

    this.enviandoRespuesta.set(true);
    this.pedirPresupuestoCtx.responderPresupuesto(solicitudId, payload).subscribe({
      next: () => {
        this.enviandoRespuesta.set(false);
        this.respuestaOk.set('Propuesta enviada. El cliente recibirá una notificación.');
      },
      error: err => {
        this.enviandoRespuesta.set(false);
        this.respuestaError.set(err?.error?.message ?? 'No se pudo enviar la propuesta.');
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
    if (!solicitudId) { this.respuestaError.set('No se encontró la solicitud.'); return; }

    const motivo = this.rechazoForm.get('motivo_rechazo')?.value?.trim() ?? '';

    this.enviandoRechazo.set(true);
    this.pedirPresupuestoCtx.rechazarPresupuesto(solicitudId).subscribe({
      next: () => {
        this.enviandoRechazo.set(false);
        this.respuestaOk.set('Solicitud rechazada. El cliente ha sido notificado.');
        this.mostrarFormRechazo.set(false);
      },
      error: err => {
        this.enviandoRechazo.set(false);
        this.respuestaError.set(err?.error?.message ?? 'No se pudo rechazar la solicitud.');
      },
    });
  }

  toggleFormRechazo(): void {
    this.mostrarFormRechazo.update(v => !v);
    this.rechazoForm.reset();
    this.respuestaError.set(null);
  }
}
