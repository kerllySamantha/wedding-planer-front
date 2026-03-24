import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PedirPresupuestoInfo, ResponderPresupuestoPayload } from '../Interfaces/PedirPresupuesto';
import { EmpresasApiServiceService } from '../Services/Empresas/empresas-api-service.service';
import { Producto } from '../Interfaces/Producto';
import { PedirPresupuestoService } from '../Services/PedirPresupuestos/pedir-presupuesto.service';

@Component({
  selector: 'app-responder-admin-presupuesto',
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink, ReactiveFormsModule],
  templateUrl: './responder-admin-presupuesto.component.html',
  styleUrl: './responder-admin-presupuesto.component.scss',
})
export class ResponderAdminPresupuestoComponent {
  private route = inject(ActivatedRoute);
  private empresasCtx = inject(EmpresasApiServiceService);
  private pedirPresupuestoCtx = inject(PedirPresupuestoService);

  protected solicitud = signal<PedirPresupuestoInfo | null>(null);
  protected productosEmpresa = signal<Producto[]>([]);
  protected enviandoRespuesta = signal(false);
  protected respuestaError = signal<string | null>(null);
  protected respuestaOk = signal<string | null>(null);
  protected resumenPropuesta = signal<{
    productoNombre: string;
    modalidad: 'servicio' | 'producto';
    fechaInicio: string;
    fechaFin: string;
    importe: number | null;
  } | null>(null);

  respuestaForm = new FormGroup({
    producto_id: new FormControl<number | null>(null, Validators.required),
    fecha_inicio: new FormControl<string>('', Validators.required),
    fecha_fin: new FormControl<string>(''),
    importe_ofertado: new FormControl<number | null>(null, Validators.required),
    comentario_empresa: new FormControl<string>(''),
  });

  private pedirPresupuestoRoute = toSignal(
    this.route.data.pipe(
      map(data => {
        const solicitud = data['solicitud'] as PedirPresupuestoInfo | { data?: PedirPresupuestoInfo } | null | undefined;
        return (solicitud as { data?: PedirPresupuestoInfo } | null)?.data ?? (solicitud as PedirPresupuestoInfo | null) ?? null;
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
      }
    });

    this.respuestaForm.get('producto_id')?.valueChanges.subscribe(() => {
      this.respuestaForm.get('fecha_inicio')?.setValue('');
      this.respuestaForm.get('fecha_fin')?.setValue('');
    });

    this.respuestaForm.valueChanges.subscribe(() => this.actualizarResumenPropuesta());
    this.actualizarResumenPropuesta();
  }

  private cargarProductosEmpresa() {
    const empresaId =
      Number(this.solicitud()?.empresa_id) ||
      Number(localStorage.getItem('idEmpresa'));
    if (!empresaId) {
      this.productosEmpresa.set([]);
      return;
    }

    this.empresasCtx.getEmpresaProductos(empresaId).subscribe({
      next: (res) => this.productosEmpresa.set(res?.data ?? []),
      error: () => this.productosEmpresa.set([]),
    });
  }

  modalidadSeleccionada(): 'producto' | 'servicio' | null {
    const productoId = this.respuestaForm.get('producto_id')?.value;
    if (!productoId) return null;
    const producto = this.productosEmpresa().find(p => p.id === productoId);
    return producto?.tipo_producto?.modalidad ?? null;
  }

  private toBackendProducto(value: string): string | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    return value;
  }

  private toBackendServicio(value: string): string | null {
    const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::\d{2})?$/.exec(value);
    if (!match) return null;
    return `${match[1]} ${match[2]}:00`;
  }

  private normalizarFechaProducto(value: string): { inicio: string; fin: string } | null {
    const inicio = this.toBackendProducto(value);
    if (!inicio) return null;
    const finRaw = this.respuestaForm.get('fecha_fin')?.value?.trim() || value;
    const fin = this.toBackendProducto(finRaw);
    if (!fin) return null;
    return { inicio, fin };
  }

  private normalizarFechaServicio(value: string): { inicio: string; fin: string } | null {
    const finRaw = this.respuestaForm.get('fecha_fin')?.value?.trim();
    const inicio = this.toBackendServicio(value);
    const fin = finRaw ? this.toBackendServicio(finRaw) : null;
    if (!inicio || !fin) return null;
    return { inicio, fin };
  }

  private actualizarResumenPropuesta() {
    const productoId = this.respuestaForm.get('producto_id')?.value;
    const modalidad = this.modalidadSeleccionada();
    if (!productoId || !modalidad) {
      this.resumenPropuesta.set(null);
      return;
    }

    const producto = this.productosEmpresa().find(p => p.id === productoId);
    const fechaInicio = this.respuestaForm.get('fecha_inicio')?.value?.trim() || '';
    const fechaFin = this.respuestaForm.get('fecha_fin')?.value?.trim() || '';

    this.resumenPropuesta.set({
      productoNombre: producto?.nombre ?? 'Producto',
      modalidad,
      fechaInicio,
      fechaFin,
      importe: this.respuestaForm.get('importe_ofertado')?.value ?? null,
    });
  }

  private validarRangoServicio(inicio: string, fin: string): boolean {
    const startMs = Date.parse(inicio);
    const endMs = Date.parse(fin);
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) return false;
    return endMs > startMs;
  }

  enviarRespuesta() {
    this.respuestaError.set(null);
    this.respuestaOk.set(null);

    const solicitudId = this.solicitud()?.id;
    if (!solicitudId) {
      this.respuestaError.set('No se encontro la solicitud.');
      return;
    }

    if (this.respuestaForm.invalid) {
      this.respuestaForm.markAllAsTouched();
      this.respuestaError.set('Completa los campos obligatorios.');
      return;
    }

    const modalidad = this.modalidadSeleccionada();
    if (!modalidad) {
      this.respuestaError.set('Selecciona un producto para determinar la modalidad.');
      return;
    }

    const fechaInicioRaw = this.respuestaForm.get('fecha_inicio')?.value?.trim() || '';
    const fechas =
      modalidad === 'servicio'
        ? this.normalizarFechaServicio(fechaInicioRaw)
        : this.normalizarFechaProducto(fechaInicioRaw);

    if (!fechas) {
      this.respuestaError.set(
        modalidad === 'servicio'
          ? 'Faltan fecha y hora (inicio y fin) con formato valido.'
          : 'Falta la fecha con formato valido.'
      );
      return;
    }

    if (modalidad === 'servicio' && !this.validarRangoServicio(fechas.inicio, fechas.fin)) {
      this.respuestaError.set('La hora de fin debe ser posterior a la de inicio.');
      return;
    }

    const payload: ResponderPresupuestoPayload = {
      producto_id: Number(this.respuestaForm.get('producto_id')?.value),
      modalidad,
      fecha_inicio: fechas.inicio,
      fecha_fin: fechas.fin,
      importe_ofertado: Number(this.respuestaForm.get('importe_ofertado')?.value),
      comentario_empresa: this.respuestaForm.get('comentario_empresa')?.value?.trim() || undefined,
    };

    this.enviandoRespuesta.set(true);
    this.pedirPresupuestoCtx.responderPresupuesto(solicitudId, payload).subscribe({
      next: () => {
        this.enviandoRespuesta.set(false);
        this.respuestaOk.set('Propuesta enviada. Queda pendiente de usuario.');
      },
      error: (err) => {
        this.enviandoRespuesta.set(false);
        this.respuestaError.set(err?.error?.message ?? 'No se pudo enviar la propuesta.');
      }
    });
  }

}
