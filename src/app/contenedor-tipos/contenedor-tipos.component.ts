import { Component, computed, effect, inject, input, signal } from '@angular/core';

import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CategoriasServiceService } from '../Services/Catergorias/categoria-service.service';
import { TipoSimple } from '../Interfaces/Tipos';
import { ItemPresupuesto, ItemsDetalleCreate, Presupuesto, PresupuestoBoda, PresupuestoCreate, PresupuestoItem } from '../Interfaces/Presupuesto';
import { ItemsDetallesService } from '../Services/ItemDetalles/items-detalles.service';
import { CountdownServiceService } from '../Services/countdown-service.service';
import { PresupuestoHttpService } from '../Services/Presupuesto/presupuesto-http-service.service';
import { DecimalPipe } from '@angular/common';
import { Boda } from '../Interfaces/Boda';
import { Router } from '@angular/router';

@Component({
  selector: 'app-contenedor-tipos',
  standalone: true,
  imports: [ReactiveFormsModule, MatProgressSpinnerModule],
  templateUrl: './contenedor-tipos.component.html',
  styleUrls: ['./contenedor-tipos.component.scss']
})
export class ContenedorTiposComponent {
  categoriasService = inject(CategoriasServiceService);
  detallesPedidoctx = inject(ItemsDetallesService);
  presupuestoctx = inject(PresupuestoHttpService);
  bodactx = inject(CountdownServiceService);
  private router = inject(Router);

  categoriaIdSeleccionada = input<number | null>(null);
  presupuestoId = input<number | null>(null);
  bodaId = computed(() => this.bodactx.bodaEncontrada()?.id);

  cargando = signal(false);
  error = signal<string | null>(null);
  detallesPorCategoria = signal<Record<number, PresupuestoItem[]>>({});

  

  

  detallesForm = new FormArray<FormGroup>([]);

  private crearFormDetalle(detalle: PresupuestoItem): FormGroup {
    return new FormGroup({
      nombre_tipo_personalizado: new FormControl(detalle.nombre_tipo_personalizado ?? '', { nonNullable: true, validators: [Validators.required] }),
      monto_estimado: new FormControl(detalle.monto_estimado ?? 0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      monto_pagado: new FormControl(detalle.monto_pagado ?? 0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    });
  }

  private sincronizarFormulario(categoriaId: number, detalles: PresupuestoItem[]) {
    this.detallesForm.clear();
    detalles.forEach((detalle) => {
      const fg = this.crearFormDetalle(detalle);
      fg.valueChanges.subscribe((value) => {
        detalle.nombre_tipo_personalizado = value.nombre_tipo_personalizado ?? '';
        detalle.monto_estimado = Number(value.monto_estimado ?? 0);
        detalle.monto_pagado = Number(value.monto_pagado ?? 0);
        detalle.es_personalizado = true;
        this.onDetalleChange(detalle);
      });
      this.detallesForm.push(fg);
    });
  }
lastId: number | null = null;
  private baseTotalesPorCategoria: Record<number, Record<number, { estimado: number; pagado: number }>> = {};
  private presupuestosBaseActuales: Array<{ monto_total: number; monto_pagado: number }> = [];
  private presupuestoIdPorTipo = new Map<number, number>();
  private creandoPresupuestoPorTipo = new Set<number>();
  private autoSaveTimers = new Map<number, number>();
  private autoSaveDelayMs = 700;

  private calcularMontoTotalPresupuesto(presupuesto: PresupuestoBoda): number {
    const items = presupuesto?.items_presupuesto;
    if (Array.isArray(items) && items.length > 0) {
      return items.reduce((acc: number, item: ItemPresupuesto) => acc + (item?.monto_estimado ?? 0), 0);
    }

    return presupuesto?.monto_total ?? 0;
  }

  private calcularMontoPagadoPresupuesto(presupuesto: PresupuestoBoda): number {
    const items = presupuesto?.items_presupuesto;
    if (Array.isArray(items) && items.length > 0) {
      return items.reduce((acc: number, item: ItemPresupuesto) => acc + (item?.monto_pagado ?? 0), 0);
    }

    return presupuesto?.monto_pagado ?? 0;
  }

  constructor() {
    effect(() => {
        console.log(this.bodactx.bodaEncontrada())
      const id = this.categoriaIdSeleccionada();
      if (id && id !== this.lastId) {
        this.lastId = id;
        this.cargarTipos(id);
      }
    });
  }

  ngOnInit(){
    console.log(this.bodactx.bodaEncontrada())
  }

  private cargarTipos(categoriaId: number) {
    this.cargando.set(true);
    this.error.set(null);

    this.categoriasService.getCategoriaTipo(categoriaId).subscribe({
      next: (res) => {
        const tipos = res?.data ?? [];
        const boda = this.bodactx.bodaEncontrada();
        if (!boda?.id) return this.cargando.set(false);

        this.presupuestoctx.getPresupuestosByBoda(boda.id).subscribe({
          next: (presRes) => {
            const presupuestos = presRes?.data ?? [];
            this.presupuestosBaseActuales = presupuestos.map((p) => {
              return {
                monto_total: this.calcularMontoTotalPresupuesto(p),
                monto_pagado: this.calcularMontoPagadoPresupuesto(p)
              };
            });
            this.presupuestoIdPorTipo.clear();
            presupuestos.forEach((p) => {
              const tipoId = p.tipo_producto?.id;
              if (tipoId) this.presupuestoIdPorTipo.set(tipoId, p.id);
            });

            const detalles: PresupuestoItem[] = tipos.map((t) => {

              // Buscar presupuesto existente para este tipo
              const p = presupuestos.find(x => x.tipo_producto?.id === t.id);
              const primerItem = p?.items_presupuesto?.[0];
              const montoEstimado = primerItem?.monto_estimado ?? p?.monto_total ?? 0;
              const montoPagado = primerItem?.monto_pagado ?? p?.monto_pagado ?? 0;
              const diferencia =
                primerItem?.diferencia ?? (montoEstimado - montoPagado);

              return {
                id: primerItem?.id,
                presupuesto_id: p?.id,
                categoria_id: categoriaId,
                tipo_producto_id: t.id,
                nombre_tipo_personalizado: primerItem?.nombre_tipo_personalizado ?? t.nombre,
                monto_estimado: montoEstimado,
                monto_pagado: montoPagado,
                diferencia: diferencia,
                es_personalizado: primerItem?.es_personalizado ?? false,
                notas: primerItem?.notas ?? ''
              } as PresupuestoItem;
            });

            this.detallesPorCategoria.update(prev => ({ ...prev, [categoriaId]: detalles }));
            this.sincronizarFormulario(categoriaId, detalles);
            this.setBaseTotalesCategoria(categoriaId, detalles);
            this.recalcularResumen();
            this.cargando.set(false);
          },
          error: (err) => this.cargando.set(false)
        });
      },
      error: () => this.cargando.set(false)
    });
  }


  guardar(event: Event) {
    event.preventDefault();
    const todos = Object.values(this.detallesPorCategoria()).flat();
    if (!todos.length) return console.error('No hay ítems para guardar');

    const bodaId = this.bodaId();
    if (!bodaId) return console.error('No se encontró la boda actual');

    this.presupuestoctx.getPresupuestosByBoda(bodaId).subscribe({
      next: (res) => {
        const presupuestos = res?.data ?? [];

        todos.forEach((item) => {
          const existente = presupuestos.find(
            (p) => p.tipo_producto?.id === item.tipo_producto_id
          );

          const basePresupuesto: PresupuestoCreate = {
            boda_id: bodaId,
            tipo_producto_id: item.tipo_producto_id,
            monto_total: 0, 
            estado: 'pendiente' ,
            fecha_creacion: new Date().toISOString().slice(0, 19).replace('T', ' ')
          };

          if (existente) {
            // Ya existe presupuesto → guardar detalle directamente
            
            this.guardarDetalle(existente.id, item);
          } else {
            // Crear nuevo presupuesto
            // Crear nuevo presupuesto
            this.presupuestoctx.postPresupuesto(basePresupuesto).subscribe({
              next: (nuevo) => {
                console.log(nuevo)
                if (!nuevo || !nuevo.id) {
                  console.error('Error: no se recibio ID del presupuesto creado');
                  return;
                }

                console.log('✅ Presupuesto creado:', nuevo);

                this.bodactx.boda.update(boda => {
                  if (!boda) return boda;
                  return {
                    ...boda,
                    presupuestos: [...(boda.presupuestos ?? []), nuevo]
                  };
                });

                // 🔁 Ahora sí, crear el detalle enlazado al presupuesto
                this.guardarDetalle(nuevo.id, item);

              },
              error: (err) => console.error('Error al crear presupuesto:', err)
            });

          }
        });
      },
      error: (err) => console.error('Error al obtener presupuestos:', err)
    });
  }

  private guardarDetalle(presupuestoId: number, item: PresupuestoItem) {
    const detalleData: ItemsDetalleCreate = {
      presupuesto_id: presupuestoId,
      categoria_id: item.categoria_id,
      tipo_producto_id: item.tipo_producto_id,
      nombre_categoria_personalizada: item.nombre_categoria_personalizada,
      nombre_tipo_personalizado: item.nombre_tipo_personalizado ?? '',
      monto_estimado: item.monto_estimado ?? 0,
      monto_pagado: item.monto_pagado ?? 0,
      es_personalizado: item.es_personalizado ?? false,
      notas: item.notas ?? ''
    };
    if (item.id) {
      this.detallesPedidoctx.editarDetalles(item.id, detalleData).subscribe({
        next: () => {
          this.recalcularResumen();
        },
        error: (err) => console.error('Error al actualizar detalle:', err)
      });
      return;
    }

    this.detallesPedidoctx.postDetalles(detalleData).subscribe({
      next: (value) => {
        const savedId = value?.id;
        if (savedId) item.id = savedId;
        this.recalcularResumen();
      },
      error: (err) => console.error('Error al guardar detalle:', err)
    });
  }

  onDetalleChange(item: PresupuestoItem) {
    if (!this.esMontoEstimadoEditable(item)) {
      const categoriaId = item.categoria_id;
      const baseItem =
        categoriaId != null
          ? this.baseTotalesPorCategoria[categoriaId]?.[item.tipo_producto_id]
          : undefined;
      if (baseItem != null) {
        item.monto_estimado = baseItem.estimado;
      }
    }

    this.programarAutoGuardado(item);
    this.recalcularResumen();
  }

  calcularDiferencia(item: PresupuestoItem): number {
    const montoEstimado = item.monto_estimado ?? 0;
    const montoPagado = item.monto_pagado ?? 0;
    return montoEstimado - montoPagado;
  }

  esMontoEstimadoEditable(item: PresupuestoItem): boolean {
    return !this.estaBloqueadoPorPago(item);
  }

  estaBloqueadoPorPago(item: PresupuestoItem): boolean {
    return (item.monto_pagado ?? 0) > 0;
  }

  tienePagoPendiente(item: PresupuestoItem): boolean {
    return (item.monto_estimado ?? 0) > (item.monto_pagado ?? 0);
  }

  irAPago(item: PresupuestoItem) {
    const presupuestoId = item.presupuesto_id ?? this.presupuestoIdPorTipo.get(item.tipo_producto_id);
    if (!presupuestoId || !this.tienePagoPendiente(item)) return;
    this.router.navigate(['/presupuesto', presupuestoId]);
  }

  private setBaseTotalesCategoria(categoriaId: number, detalles: PresupuestoItem[]) {
    const base: Record<number, { estimado: number; pagado: number }> = {};
    detalles.forEach((item) => {
      base[item.tipo_producto_id] = {
        estimado: item.monto_estimado ?? 0,
        pagado: item.monto_pagado ?? 0
      };
    });
    this.baseTotalesPorCategoria[categoriaId] = base;
  }

  private recalcularResumen() {
    const boda = this.bodactx.bodaEncontrada();
    if (!boda) return;

    const presupuestos = this.presupuestosBaseActuales;
    const baseTotal = presupuestos.reduce((total, p) => total + (p.monto_total ?? 0), 0);
    const basePagado = presupuestos.reduce((total, p) => total + (p.monto_pagado ?? 0), 0);

    let deltaEstimado = 0;
    let deltaPagado = 0;

    const detalles = this.detallesPorCategoria();
    Object.entries(detalles).forEach(([categoriaIdStr, items]) => {
      const categoriaId = Number(categoriaIdStr);
      const base = this.baseTotalesPorCategoria[categoriaId] ?? {};
      items.forEach((item) => {
        const baseItem = base[item.tipo_producto_id] ?? { estimado: 0, pagado: 0 };
        deltaEstimado += (item.monto_estimado ?? 0) - baseItem.estimado;
        deltaPagado += (item.monto_pagado ?? 0) - baseItem.pagado;
      });
    });

    const total = baseTotal + deltaEstimado;
    const pagado = basePagado + deltaPagado;
    this.bodactx.setTotalesEnEdicion(total, pagado);
  }

  private programarAutoGuardado(item: PresupuestoItem) {
    const key = item.id ?? item.tipo_producto_id;
    const prev = this.autoSaveTimers.get(key);
    if (prev) clearTimeout(prev);

    const timerId = window.setTimeout(() => {
      this.autoSaveTimers.delete(key);
      this.guardarItemAuto(item);
    }, this.autoSaveDelayMs);

    this.autoSaveTimers.set(key, timerId);
  }

  private guardarItemAuto(item: PresupuestoItem) {
    const bodaId = this.bodaId();
    if (!bodaId) return;

    const presupuestoId =
      item.presupuesto_id ?? this.presupuestoIdPorTipo.get(item.tipo_producto_id);

    if (presupuestoId) {
      item.presupuesto_id = presupuestoId;
      this.guardarDetalle(presupuestoId, item);
      return;
    }

    if (this.creandoPresupuestoPorTipo.has(item.tipo_producto_id)) return;

    this.creandoPresupuestoPorTipo.add(item.tipo_producto_id);

    const basePresupuesto: PresupuestoCreate = {
      boda_id: bodaId,
      tipo_producto_id: item.tipo_producto_id,
      monto_total: 0,
      estado: 'pendiente',
      fecha_creacion: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    this.presupuestoctx.postPresupuesto(basePresupuesto).subscribe({
      next: (nuevo) => {
        this.creandoPresupuestoPorTipo.delete(item.tipo_producto_id);
        if (!nuevo || !nuevo.id) {
          console.error('Error: no se recibio ID del presupuesto creado');
          return;
        }

        this.presupuestoIdPorTipo.set(item.tipo_producto_id, nuevo.id);
        item.presupuesto_id = nuevo.id;

        this.bodactx.boda.update(boda => {
          if (!boda) return boda;
          return {
            ...boda,
            presupuestos: [...(boda.presupuestos ?? []), nuevo]
          };
        });

        this.guardarDetalle(nuevo.id, item);
      },
      error: (err) => {
        this.creandoPresupuestoPorTipo.delete(item.tipo_producto_id);
        console.error('Error al crear presupuesto:', err);
      }
    });
  }

  ngOnDestroy() {
    this.autoSaveTimers.forEach((timerId) => clearTimeout(timerId));
    this.autoSaveTimers.clear();
    this.bodactx.limpiarTotalesEnEdicion();
  }


}
