import { Component, computed, effect, inject, input, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CategoriasServiceService } from '../Services/Catergorias/categoria-service.service';
import { TipoSimple } from '../Interfaces/Tipos';
import { ItemsDetalleCreate, PresupuestoCreate, PresupuestoItem } from '../Interfaces/Presupuesto';
import { ItemsDetallesService } from '../Services/ItemDetalles/items-detalles.service';
import { CountdownServiceService } from '../Services/countdown-service.service';
import { PresupuestoHttpService } from '../Services/Presupuesto/presupuesto-http-service.service';

@Component({
  selector: 'app-contenedor-tipos',
  standalone: true,
  imports: [FormsModule, MatProgressSpinnerModule],
  templateUrl: './contenedor-tipos.component.html',
  styleUrls: ['./contenedor-tipos.component.scss']
})
export class ContenedorTiposComponent {
  categoriasService = inject(CategoriasServiceService);
  detallesPedidoctx = inject(ItemsDetallesService);
  presupuestoctx = inject(PresupuestoHttpService);
  bodactx = inject(CountdownServiceService);

  categoriaIdSeleccionada = input<number | null>(null);
  presupuestoId = input<number | null>(null);
  bodaId = computed(() => this.bodactx.bodaEncontrada()?.id);

  cargando = signal(false);
  error = signal<string | null>(null);
  detallesPorCategoria = signal<Record<number, PresupuestoItem[]>>({});

  lastId: number | null = null;

  constructor() {
    effect(() => {
      const id = this.categoriaIdSeleccionada();
      if (id && id !== this.lastId) {
        this.lastId = id;
        this.cargarTipos(id);
      }
    });
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

            const detalles: PresupuestoItem[] = tipos.map((t) => {
              // Buscar presupuesto existente para este tipo
              const p = presupuestos.find(x => x.tipo_producto?.id === t.id);
              const primerItem = p?.items_presupuesto?.[0];

              return {
                id: undefined,
                presupuesto_id: p?.id,
                categoria_id: categoriaId,
                tipo_producto_id: t.id,
                nombre_tipo_personalizado: t.nombre,
                precio_unitario: primerItem?.precio_unitario ?? p?.monto_total ?? 0,
                cantidad: primerItem?.cantidad ?? 1,
                total_item: primerItem?.total_item ?? p?.monto_total ?? 0,
                es_personalizado: false,
                notas: ''
              } as PresupuestoItem;
            });

            this.detallesPorCategoria.update(prev => ({ ...prev, [categoriaId]: detalles }));
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
            monto_total: 0, // ⬅️ Inicialmente vacío
            estado: true,
            fecha_creacion: new Date().toISOString().slice(0, 19).replace('T', ' ')
          };

          if (existente) {
            // Ya existe presupuesto → guardar detalle directamente
            
            this.guardarDetalle(existente.id, item, existente.tipo_producto.id);
          } else {
            // Crear nuevo presupuesto
            // Crear nuevo presupuesto
            this.presupuestoctx.postPresupuesto(basePresupuesto).subscribe({
              next: (nuevo) => {
                console.log(nuevo)
                if (!nuevo || !nuevo.id) {
                  console.error('❌ Error: no se recibió ID del presupuesto creado');
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
                const tipoProductoId = basePresupuesto.tipo_producto_id;


                if (!tipoProductoId) {
                  console.warn('⚠️ No se encontró tipo_producto_id en el presupuesto creado');
                }

                this.guardarDetalle(nuevo.id, item, tipoProductoId);

              },
              error: (err) => console.error('❌ Error al crear presupuesto:', err)
            });

          }
        });
      },
      error: (err) => console.error('Error al obtener presupuestos:', err)
    });
  }

  private guardarDetalle(presupuestoId: number, item: PresupuestoItem, tipoProductoId: number) {
    const detalleData: ItemsDetalleCreate = {
      presupuesto_id: presupuestoId,
      tipo_producto_id: tipoProductoId,
      categoria_id: item.categoria_id!,
      nombre_tipo_personalizado: item.nombre_tipo_personalizado ?? '',
      precio_unitario: item.precio_unitario ?? 0,
      cantidad: item.cantidad ?? 1,
      total_item: (item.precio_unitario ?? 0) * (item.cantidad ?? 1),
      es_personalizado: item.es_personalizado ?? false,
      notas: item.notas ?? ''
    };

    this.detallesPedidoctx.postDetalles(detalleData).subscribe({
      next: value => {

        console.log('💾 Detalle guardado y presupuesto actualizado en backend:', value);
        // Ya no necesitas recalcular ni editar desde el front

      },
      error: (err) => console.error('❌ Error al guardar detalle:', err)
    });
  }


  // private actualizarMontosTodosPresupuestos(bodaId: number) {
  //   // 1️⃣ Traer todos los presupuestos de la boda
  //   this.presupuestoctx.getPresupuestosByBoda(bodaId).subscribe({
  //     next: (res) => {
  //       const presupuestos = res?.data ?? [];
  //       presupuestos.forEach((presupuesto) => {
  //         // 2️⃣ Traer detalle_item de este presupuesto
  //         this.detallesPedidoctx.getDetallesPorPresupuesto(presupuesto.id).subscribe({
  //           next: (detRes) => {
  //             const detalle = detRes?.data?.[0]; // asumimos 1:1
  //             if (!detalle) return;

  //             const montoActualizado = detalle.precio_unitario ?? detalle.total_item ?? 0;

  //             // 3️⃣ Preparar datos de presupuesto actualizado
  //             const presupuestoData: PresupuestoCreate = {
  //               boda_id: bodaId,
  //               tipo_producto_id: presupuesto.tipo_producto?.id ?? 0,
  //               monto_total: montoActualizado,
  //               estado: presupuesto.estado ?? true,
  //               fecha_creacion: presupuesto.fecha_creacion ?? new Date().toISOString().slice(0, 19).replace('T', ' ')
  //             };

  //             // 4️⃣ Actualizar presupuesto
  //             this.presupuestoctx.editarPresupuesto(presupuesto.id, presupuestoData).subscribe({
  //               next: () => console.log(`✅ Presupuesto ${presupuesto.id} actualizado con monto_total = ${montoActualizado}`),
  //               error: (err) => console.error('❌ Error al actualizar presupuesto', err)
  //             });
  //           },
  //           error: (err) => console.error('❌ Error al obtener detalle del presupuesto', err)
  //         });
  //       });
  //     },
  //     error: (err) => console.error('❌ Error al traer presupuestos de la boda', err)
  //   });
  // }

}
