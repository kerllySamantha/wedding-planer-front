import { Component } from '@angular/core';

@Component({
  selector: 'app-editor-contenedor-presupuesto',
  imports: [],
  templateUrl: './editor-contenedor-presupuesto.component.html',
  styleUrl: './editor-contenedor-presupuesto.component.scss'
})
export class EditorContenedorPresupuestoComponent {

  // ngOnInit() {
  //   const boda = this.bodactx.bodaEncontrada();
  //   if (boda?.id) {
  //     this.cargarPresupuestosExistentes(boda.id);
  //   }
  // }



  // private cargarPresupuestosExistentes(bodaId: number) {
  //   this.presupuestoctx.getPresupuestosByBoda(bodaId).subscribe({
  //     next: (res) => {
  //       const presupuestos = res?.data ?? [];
  //       console.log('✅ Presupuestos existentes:', presupuestos);


  //       const detallesAgrupados = presupuestos.reduce((acc: any, p: any) => {
  //         const categoriaId = p.tipo_producto?.categoria_id ?? 0;
  //         if (!acc[categoriaId]) acc[categoriaId] = [];

  //         acc[categoriaId].push({
  //           id: p.id,
  //           presupuesto_id: p.id,
  //           categoria_id: categoriaId,
  //           tipo_producto_id: p.tipo_producto?.id ?? 0,
  //           nombre_tipo_personalizado: p.tipo_producto?.nombre ?? '',
  //           monto_asignado: p.monto_total ?? 0,
  //           cantidad: 1,
  //           total_item: p.monto_total ?? 0,
  //           es_personalizado: false,
  //           notas: ''
  //         });

  //         return acc;
  //       }, {});

  //       this.detallesPorCategoria.set(detallesAgrupados);
  //       this.cargando.set(false);
  //     },
  //     error: (err) => {
  //       console.error('❌ Error al cargar presupuestos:', err);
  //       this.cargando.set(false);
  //     }
  //   });
  // }


  // private cargarTiposNuevos(categoriaId: number) {
  //   this.categoriasService.getCategoriaTipo(categoriaId).subscribe({
  //     next: (res) => {
  //       const tipos: TipoSimple[] = res?.data ?? [];

  //       const prevDetalles = this.detallesPorCategoria()[categoriaId] ?? [];

  //       const nuevosDetalles: PresupuestoItem[] = tipos.map((t) => {
  //         const existente = prevDetalles.find(d => d.tipo_producto_id === t.id);
  //         return existente || {
  //           id: 0,
  //           presupuesto_id: this.presupuestoId() ?? 0,
  //           categoria_id: categoriaId,
  //           tipo_producto_id: t.id,
  //           nombre_tipo_personalizado: t.nombre,
  //           monto_asignado: 0,
  //           cantidad: 0,
  //           total_item: 0,
  //           es_personalizado: false,
  //           notas: ''
  //         };
  //       });

  //       this.detallesPorCategoria.update(prev => ({
  //         ...prev,
  //         [categoriaId]: nuevosDetalles
  //       }));

  //       this.cargando.set(false);
  //     },
  //     error: () => {
  //       this.cargando.set(false);
  //       this.error.set('No se pudieron cargar los tipos.');
  //     }
  //   });
  // }



  // private cargarTipos(categoriaId: number) {
  //   this.cargando.set(true);
  //   this.error.set(null);

  //   const presupuestoId = this.presupuestoId();
  //   if (presupuestoId) {
  //     this.detallesPedidoctx.getDetallesPorPresupuesto(presupuestoId).subscribe({
  //       next: (res) => {
  //         const items = res?.data ?? [];
  //         const itemsCategoria = items.filter(item => item.categoria_id === categoriaId);

  //         if (itemsCategoria.length > 0) {
  //           console.log('✅ Cargando ítems desde backend:', itemsCategoria);
  //           this.detallesPorCategoria.update(prev => ({
  //             ...prev,
  //             [categoriaId]: itemsCategoria
  //           }));
  //           this.cargando.set(false);
  //         } else {
  //           console.warn('⚠️ No se encontraron ítems en backend, creando nuevos.');
  //           this.cargarTiposNuevos(categoriaId);
  //         }
  //       },
  //       error: (err) => {
  //         console.error('Error al traer ítems:', err);
  //         this.cargarTiposNuevos(categoriaId);
  //       }
  //     });
  //   } else {
  //     console.log(' Sin presupuestoId, creando ítems nuevos en blanco');
  //     this.cargarTiposNuevos(categoriaId);
  //   }

  // }





  // private haCambiado(detalle: PresupuestoItem): boolean {
  //   if (!detalle) return false;

  //   return (
  //     (detalle.monto_asignado ?? 0) > 0 ||
  //     (detalle.total_item ?? 0) > 0 ||
  //     (detalle.cantidad ?? 0) > 0 ||
  //     detalle.es_personalizado === true
  //   );
  // }




  // private guardarItems(presupuestoId: number) {
  //   if (!presupuestoId) return;

  //   const todos = Object.values(this.detallesPorCategoria()).flat();

  //   todos.forEach(todo => {
  //     todo.presupuesto_id = presupuestoId;

  //     // Si el item ya tiene ID, actualizar; si no, crear
  //     const peticion = todo.id && todo.id > 0
  //       ? this.detallesPedidoctx.editarDetalles(todo.id, todo)
  //       : this.detallesPedidoctx.postDetalles(todo);

  //     peticion.subscribe({
  //       next: (resp) => console.log('✅ Item guardado o actualizado:', resp),
  //       error: (err) => console.error('❌ Error al guardar item:', err)
  //     });
  //   });
  // }


  // guardar(event: Event) {
  //   event.preventDefault();

    //   const todos = Object.values(this.detallesPorCategoria()).flat();
    //   if (!todos.length) {
    //     console.error('No hay ítems cargados para guardar');
    //     return;
    //   }

    //   const presupuestoId = this.presupuestoId();

    //   if (presupuestoId) {
    //     console.log('Actualizando ítems existentes...');
    //     this.guardarItems(presupuestoId);
    //     return;
    //   }

    //   const montoTotal = todos.reduce((sum, item) => sum + (item.total_item ?? 0), 0);

    //   const nuevoPresupuesto: PresupuestoCreate = {
    //     boda_id: this.bodaId()!,
    //     tipo_producto_id: 12,
    //     monto_total: montoTotal,
    //     estado: true,
    //     fecha_creacion: new Date().toISOString().slice(0, 19).replace('T', ' ')
    //   };

    //   console.log('🆕 Creando nuevo presupuesto...');
    //   this.presupuestoctx.postPresupuesto(nuevoPresupuesto).subscribe({
    //     next: (res) => {
    //       if (!res?.id) {
    //         console.error('No se pudo crear el presupuesto');
    //         return;
    //       }

    //       const nuevoId = res.id;
    //       this.guardarItems(nuevoId);
    //     },
    //     error: (err) => {
    //       console.error('Error al crear presupuesto', err);
    //     }
    //   });
  // }





}
