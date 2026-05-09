import { Component, computed, inject, signal } from '@angular/core';
import { EmpresasApiServiceService } from '../Services/Empresas/empresas-api-service.service';
import { Empresa } from '../Interfaces/Empresa';
import { CategoriasApiServiceService } from '../Services/Catergorias/categoria-api-service.service';
import { InfoCategoria } from '../Interfaces/Categoria';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { CreateEmpresa } from '../Interfaces/Empresa';
import { Foto } from '../Interfaces/Resenia';
import { HttpClient } from '@angular/common/http';
import { Producto } from '../Interfaces/Producto';

@Component({
  selector: 'app-configuracion-admin',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './configuracion-admin.component.html',
  styleUrl: './configuracion-admin.component.scss',
})
export class ConfiguracionAdminComponent {
  empresaCtx = inject(EmpresasApiServiceService);
  categoriaCtx = inject(CategoriasApiServiceService);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  empresa = signal<Empresa | null>(null);
  categorias = signal<InfoCategoria[]>([]);
  productosSeleccionados = signal<number[]>([]);
  categoriaSeleccionadaId = signal<number | null>(null);
  productosCatalogoGeneral = signal<Producto[]>([]);

  productosPersonalizados = signal<
    Record<
      number,
      Array<{
        id: number;
        nombre: string;
        descripcion: string;
        precio_min: string;
        precio_max: string;
      }>
    >
  >({});
  nuevosProductosPorTipo = signal<
    Record<
      number,
      Array<{
        nombre: string;
        descripcion: string;
        precio_min: string;
        precio_max: string;
      }>
    >
  >({});
  galeriaUrls = signal<Foto[]>([]);
  empresaSinImagenes = computed(() => (this.empresa()?.fotos?.length ?? 0) === 0);
  loadingUpload = signal(false);
  saving = signal(false);
  modoEdicion = signal(false);
  productosError = signal(false);
  productosRangoError = signal<string | null>(null);
  idUser = signal<string>(localStorage.getItem('id')!);
  form = this.fb.group(
    {
      nombre_empresa: ['', [Validators.required, Validators.minLength(2)]],
      tipo_servicio: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      direccion: ['', [Validators.required, Validators.minLength(5)]],
      productosSeleccionados: this.fb.control<number[]>([], {
        nonNullable: true,
      }),
    },
    { validators: [this.cruceContactoValidator()] },
  );

  ngOnInit() {
    this.getEmpresa();
    this.getCategorias();
    this.getProductosCatalogoGeneral();
  }

  getEmpresa() {
    this.empresaCtx.getEmpresaByUser(Number(this.idUser())).subscribe({
      next: (data) => {
        const empresa = data?.data ?? null;
        this.empresa.set(empresa);
        if (!empresa) return;
        this.form.patchValue({
          nombre_empresa: empresa.nombre_empresa ?? '',
          tipo_servicio: empresa.tipo_servicio ?? '',
          email: empresa.usuario?.email ?? '',
          telefono: empresa.telefono ?? '',
          name: empresa.usuario?.name ?? '',
          direccion: empresa.direccion ?? '',
        });
        this.productosSeleccionados.set([
          ...new Set((empresa.productos ?? []).map((item) => item.id)),
        ]);
        this.form.controls.productosSeleccionados.setValue(
          this.productosSeleccionados(),
        );
        this.nuevosProductosPorTipo.set({});
        this.inicializarProductosPersonalizados();
        const fotos: Foto[] = ((empresa.fotos ?? []) as Foto[])
          .map((foto) => ({
            path: foto.path,
            url: this.normalizeImageUrl(foto.url),
          }))
          .filter((foto) => Boolean(foto.url));

        this.galeriaUrls.set(fotos);
        this.inicializarCategoriaSeleccionada();
      },
    });
  }

  getCategorias() {
    this.categoriaCtx.getCategorias().subscribe({
      next: (data) => {
        const categorias = data?.data ?? [];
        this.categorias.set(categorias);
        this.inicializarCategoriaSeleccionada();
      },
      error: (err) => console.error('Error al cargar categorías', err),
    });
  }

  private inicializarCategoriaSeleccionada() {
    const categorias = this.categorias();
    if (!categorias.length) return;

    const productosEmpresa = this.empresa()?.productos ?? [];
    let categoriaObjetivoId: number | null = null;

    const categoriaValidaDesdeProducto = productosEmpresa.find((producto) =>
      categorias.some((categoria) => categoria.id === producto.categoria?.id),
    );

    if (categoriaValidaDesdeProducto?.categoria?.id) {
      categoriaObjetivoId = categoriaValidaDesdeProducto.categoria.id;
    }

    if (!categoriaObjetivoId) {
      const categoriaPorTipo = productosEmpresa
        .map((producto) => producto.tipo_producto?.id)
        .filter((tipoId): tipoId is number => Boolean(tipoId))
        .map((tipoId) =>
          categorias.find((categoria) =>
            (categoria.tipos ?? []).some((tipo) => tipo.id === tipoId),
          ),
        )
        .find((categoria): categoria is InfoCategoria => Boolean(categoria));

      if (categoriaPorTipo) {
        categoriaObjetivoId = categoriaPorTipo.id;
      }
    }

    if (!categoriaObjetivoId) {
      categoriaObjetivoId = categorias[0].id;
    }

    if (this.categoriaSeleccionadaId() !== categoriaObjetivoId) {
      this.categoriaSeleccionadaId.set(categoriaObjetivoId);
    }
  }

  getProductosCatalogoGeneral() {
    this.http
      .get<{ data: Producto[] }>(`${this.empresaCtx.apiUrl}/productos`)
      .subscribe({
        next: (response) => {
          this.productosCatalogoGeneral.set(response?.data ?? []);
          this.inicializarProductosPersonalizados();
        },
        error: (err) => {
          console.error('Error al cargar productos globales', err);
          this.productosCatalogoGeneral.set([]);
        },
      });
  }

  productosAgrupadosPorCategoria(): Array<{
    categoria: string;
    productos: Empresa['productos'];
  }> {
    const productos = this.empresa()?.productos ?? [];
    const map = new Map<string, Empresa['productos']>();
    productos.forEach((p) => {
      const categoria = p.categoria?.nombre ?? 'Sin categoría';
      const actual = map.get(categoria) ?? [];
      actual.push(p);
      map.set(categoria, actual);
    });
    return Array.from(map.entries()).map(([categoria, productosCategoria]) => ({
      categoria,
      productos: productosCategoria,
    }));
  }

  onProductoToggle(productoId: number, checked: boolean) {
    const current = new Set(this.productosSeleccionados());
    checked ? current.add(productoId) : current.delete(productoId);
    const seleccionados = Array.from(current);
    this.productosSeleccionados.set(seleccionados);
    this.form.controls.productosSeleccionados.setValue(seleccionados);
    this.productosError.set(false);
    this.productosRangoError.set(null);
  }

  productosPorTipo(tipoId: number) {
    const categoriaSeleccionada = this.categorias().find(
      (c) => c.id === this.categoriaSeleccionadaId(),
    );
    const tipoPerteneceCategoria = (categoriaSeleccionada?.tipos ?? []).some(
      (tipo) => tipo.id === tipoId,
    );
    if (!tipoPerteneceCategoria) return [];

    const productosEmpresa = this.empresa()?.productos ?? [];
    const idsEmpresa = new Set(productosEmpresa.map((producto) => producto.id));
    const map = new Map<string, Producto>();

    const upsertProducto = (producto: Producto) => {
      if (producto.tipo_producto?.id !== tipoId) return;
      if (!producto.id) return;
      const key = this.productoComparableKey(producto);
      const existente = map.get(key);
      if (!existente) {
        map.set(key, producto);
        return;
      }
      const actualEsEmpresa = idsEmpresa.has(existente.id);
      const nuevoEsEmpresa = idsEmpresa.has(producto.id);
      if (!actualEsEmpresa && nuevoEsEmpresa) {
        map.set(key, producto);
      }
    };

    this.productosCatalogoGeneral().forEach(upsertProducto);
    productosEmpresa.forEach(upsertProducto);

    return Array.from(map.values());
  }

  private productoComparableKey(producto: Producto): string {
    const tipoId = producto.tipo_producto?.id ?? 0;
    const nombre = (producto.nombre ?? '').trim().toLowerCase();
    return `${tipoId}::${nombre}`;
  }

  unidadPorModalidad(modalidad?: string): string {
    return modalidad === 'servicio' ? 'horas' : 'días';
  }



  private inicializarProductosPersonalizados() {
    const catalogoIds = new Set(this.productosCatalogoGeneral().map((p) => p.id));
    const porTipo: Record<number, Array<{ id: number; nombre: string; descripcion: string; precio_min: string; precio_max: string }>> = {};
    const empresaId = this.empresa()?.id;
    const productosPropiosEnCatalogo = new Set(
      this.productosCatalogoGeneral()
        .filter((producto) => Boolean(empresaId) && producto.empresa?.id === empresaId)
        .map((producto) => producto.id),
    );

    for (const producto of this.empresa()?.productos ?? []) {
      const esPropioEmpresa = productosPropiosEnCatalogo.has(producto.id);
      if (!esPropioEmpresa && catalogoIds.has(producto.id)) continue;
      const tipoId = producto.tipo_producto?.id;
      if (!tipoId) continue;
      porTipo[tipoId] = porTipo[tipoId] ?? [];
      porTipo[tipoId].push({
        id: producto.id,
        nombre: producto.nombre ?? '',
        descripcion: producto.descripcion ?? '',
        precio_min: String(producto.precio_min ?? ''),
        precio_max: String(producto.precio_max ?? ''),
      });
    }
    this.productosPersonalizados.set(porTipo);
  }

  onProductoPersonalizadoFieldInput(
    tipoId: number,
    idx: number,
    field: 'nombre' | 'descripcion' | 'precio_min' | 'precio_max',
    value: string,
  ) {
    this.productosPersonalizados.update((prev) => {
      const lista = [...(prev[tipoId] ?? [])];
      if (idx < 0 || idx >= lista.length) return prev;
      lista[idx] = { ...lista[idx], [field]: value };
      return { ...prev, [tipoId]: lista };
    });
    this.productosRangoError.set(null);
  }

  onCategoriaSeleccionada(categoriaId: number) {
    this.categoriaSeleccionadaId.set(categoriaId);
  }

  tiposEditablesEmpresa(): Array<{
    categoriaNombre: string;
    tipoId: number;
    tipoNombre: string;
  }> {
    const map = new Map<
      number,
      { categoriaNombre: string; tipoId: number; tipoNombre: string }
    >();
    for (const categoria of this.categorias()) {
      for (const tipo of categoria.tipos ?? []) {
        if (map.has(tipo.id)) continue;
        map.set(tipo.id, {
          categoriaNombre: categoria.nombre ?? 'Sin categoría',
          tipoId: tipo.id,
          tipoNombre: tipo.nombre,
        });
      }
    }

    for (const producto of this.empresa()?.productos ?? []) {
      const tipo = producto.tipo_producto;
      if (!tipo || map.has(tipo.id)) continue;
      map.set(tipo.id, {
        categoriaNombre: producto.categoria?.nombre ?? 'Sin categoría',
        tipoId: tipo.id,
        tipoNombre: tipo.nombre,
      });
    }

    return Array.from(map.values()).sort(
      (a, b) =>
        a.categoriaNombre.localeCompare(b.categoriaNombre) ||
        a.tipoNombre.localeCompare(b.tipoNombre),
    );
  }

  categoriasEmpresa(): InfoCategoria[] {
    return this.categorias();
  }

  tiposEditablesPorCategoriaEmpresa(): Array<{
    categoriaNombre: string;
    tipos: Array<{ tipoId: number; tipoNombre: string }>;
  }> {
    const categoriaSeleccionada = this.categorias().find(
      (c) => c.id === this.categoriaSeleccionadaId(),
    );
    const tiposFiltrados = (categoriaSeleccionada?.tipos ?? []).map((tipo) => ({
      categoriaNombre: categoriaSeleccionada?.nombre ?? 'Sin categoría',
      tipoId: tipo.id,
      tipoNombre: tipo.nombre,
    }));

    const map = new Map<string, Array<{ tipoId: number; tipoNombre: string }>>();
    tiposFiltrados.forEach((tipo) => {
      const actuales = map.get(tipo.categoriaNombre) ?? [];
      actuales.push({ tipoId: tipo.tipoId, tipoNombre: tipo.tipoNombre });
      map.set(tipo.categoriaNombre, actuales);
    });

    return Array.from(map.entries()).map(([categoriaNombre, tiposCat]) => ({
      categoriaNombre,
      tipos: tiposCat,
    }));
  }

  agregarCampoNuevoProducto(tipoId: number) {
    this.nuevosProductosPorTipo.update((prev) => ({
      ...prev,
      [tipoId]: [
        ...(prev[tipoId] ?? []),
        { nombre: '', descripcion: '', precio_min: '', precio_max: '' },
      ],
    }));
  }

  onNuevoProductoInput(tipoId: number, idx: number, value: string) {
    this.nuevosProductosPorTipo.update((prev) => {
      const lista = [...(prev[tipoId] ?? [])];
      if (idx < 0 || idx >= lista.length) return prev;
      lista[idx] = { ...lista[idx], nombre: value };
      return { ...prev, [tipoId]: lista };
    });
    this.productosError.set(false);
    this.productosRangoError.set(null);
  }
  onNuevoProductoFieldInput(
    tipoId: number,
    idx: number,
    field: 'descripcion' | 'precio_min' | 'precio_max',
    value: string,
  ) {
    this.nuevosProductosPorTipo.update((prev) => {
      const lista = [...(prev[tipoId] ?? [])];
      if (idx < 0 || idx >= lista.length) return prev;
      lista[idx] = { ...lista[idx], [field]: value };
      return { ...prev, [tipoId]: lista };
    });
    this.productosError.set(false);
    this.productosRangoError.set(null);
  }

  eliminarCampoNuevoProducto(tipoId: number, idx: number) {
    this.nuevosProductosPorTipo.update((prev) => {
      const lista = [...(prev[tipoId] ?? [])];
      if (idx < 0 || idx >= lista.length) return prev;
      lista.splice(idx, 1);
      return { ...prev, [tipoId]: lista };
    });
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const extension = this.getImageExtension(file);
    const userId = Number(this.idUser());
    if (!extension || Number.isNaN(userId)) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result ?? '');
      if (!base64) return;
      this.loadingUpload.set(true);
      this.empresaCtx.uploadImageBase64(base64, extension, userId).subscribe({
        next: (res) => {
          console.log('Respuesta subida imagen:', res);

          const path = res?.path ?? '';
          const url = this.normalizeImageUrl(res?.url ?? '');

          if (path && url) {
            this.galeriaUrls.set([...this.galeriaUrls(), { path, url }]);
          }
          this.loadingUpload.set(false);
        },
        error: (err) => {
          console.error('Error completo:', err);
          console.error('Errores Laravel:', err.error?.errors);
          console.error('Mensaje:', err.error?.message);
          this.saving.set(false);
        },
      });
    };
    reader.readAsDataURL(file);
  }

  private getImageExtension(file: File): string | null {
    const extensionFromName = file.name.split('.').pop()?.toLowerCase() ?? '';
    const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    if (allowed.includes(extensionFromName)) {
      return extensionFromName;
    }

    const extensionFromType = file.type.split('/').pop()?.toLowerCase() ?? '';
    if (allowed.includes(extensionFromType)) {
      return extensionFromType;
    }

    return null;
  }

  activarEdicion() {
    this.modoEdicion.set(true);
  }

  cancelarEdicion() {
    this.modoEdicion.set(false);
    this.getEmpresa();
  }

  guardarCambios() {
    const empresa = this.empresa();
    if (!empresa?.id) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    const productosPayload =
      this.buildProductosPayload(values.productosSeleccionados ?? []) ?? [];
    if (productosPayload.length === 0) {
      this.productosError.set(true);
      return;
    }
    this.productosError.set(false);
    const productoConRangoInvalido = productosPayload.find((producto) => {
      const min = producto.precio_min;
      const max = producto.precio_max;
      return (
        typeof min === 'number' &&
        typeof max === 'number' &&
        !Number.isNaN(min) &&
        !Number.isNaN(max) &&
        min > max
      );
    });
    if (productoConRangoInvalido) {
      this.productosRangoError.set(
        `El producto "${productoConRangoInvalido.nombre}" tiene un rango inválido: precio mínimo mayor al máximo.`,
      );
      return;
    }
    this.productosRangoError.set(null);
    const formEmpresa: CreateEmpresa = {
      nombre_empresa: values.nombre_empresa ?? '',
      tipo_servicio: values.tipo_servicio ?? '',
      email: values.email ?? '',
      telefono: values.telefono ?? '',
      name: values.name ?? '',
      password: '',
      poblacion_id: empresa.poblacion?.id ?? 0,
      direccion: values.direccion ?? '',
      descripcion: empresa.descripcion ?? '',
      logo: empresa.logo ?? '',
      fotos: this.galeriaUrls(),
      productos: productosPayload,
      productos_eliminados: this.getProductosEliminados(values.productosSeleccionados ?? []),
    };

    this.saving.set(true);
    this.empresaCtx.editEmpresa(String(empresa.id), formEmpresa).subscribe({
      next: (value) => {
        console.log(value);
        this.saving.set(false);
        this.modoEdicion.set(false);
        this.getEmpresa();
      },
      error: (err) => {
        console.error('Error al guardar cambios del perfil', err);
        this.saving.set(false);
      },
    });
  }

  private buildProductosPayload(
    productosSeleccionados: number[],
  ): CreateEmpresa['productos'] {
    const empresaActual = this.empresa();
    const productosActuales = empresaActual?.productos ?? [];
    const payload: NonNullable<CreateEmpresa['productos']> = [];

    const personalizadosIds = new Set(
      Object.values(this.productosPersonalizados())
        .flat()
        .map((item) => item.id),
    );

    for (const productoId of productosSeleccionados) {
      const productoExistente = productosActuales.find((p) => p.id === productoId);
      if (productoExistente && !personalizadosIds.has(productoId)) {
        payload.push({
          id: productoExistente.id ?? null,
          nombre:
            productoExistente.nombre ??
            productoExistente.tipo_producto?.nombre ??
            '',
          descripcion: productoExistente.descripcion ?? '',
          precio_max: productoExistente.precio_max ?? 0,
          precio_min: productoExistente.precio_min ?? 0,
          tipo_producto_nombre: productoExistente.tipo_producto?.nombre ?? '',
          categoria_nombre: productoExistente.categoria?.nombre ?? '',
        });
        continue;
      }

      const productoCatalogo = this.productosCatalogoGeneral().find(
        (p) => p.id === productoId,
      );
      if (!productoCatalogo) continue;
      payload.push({
        // Para productos del catálogo general que aún no pertenecen a la empresa,
        // enviamos id null para que backend los asocie/cree correctamente.
        id: null,
        nombre: productoCatalogo.nombre ?? '',
        descripcion: productoCatalogo.descripcion ?? '',
        precio_max: productoCatalogo.precio_max ?? 0,
        precio_min: productoCatalogo.precio_min ?? 0,
        tipo_producto_nombre: productoCatalogo.tipo_producto?.nombre ?? '',
        categoria_nombre: this.findCategoriaNombreByTipoId(
          productoCatalogo.tipo_producto?.id,
        ),
      });
    }

    Object.entries(this.productosPersonalizados()).forEach(([tipoIdStr, productos]) => {
      const tipoInfo = this.findTipoById(Number(tipoIdStr));
      if (!tipoInfo) return;
      productos.forEach((productoEditado) => {
        const nombreLimpio = productoEditado.nombre.trim();
        if (!nombreLimpio) return;
        payload.push({
          id: productoEditado.id,
          nombre: nombreLimpio,
          descripcion: productoEditado.descripcion.trim() || undefined,
          precio_max: productoEditado.precio_max ? Number(productoEditado.precio_max) : undefined,
          precio_min: productoEditado.precio_min ? Number(productoEditado.precio_min) : undefined,
          tipo_producto_nombre: tipoInfo.nombre,
          categoria_nombre: tipoInfo.categoriaNombre,
        });
      });
    });

    Object.entries(this.nuevosProductosPorTipo()).forEach(
      ([tipoIdStr, productos]) => {
        const tipoInfo = this.findTipoById(Number(tipoIdStr));
        if (!tipoInfo) return;
        productos.forEach((productoNuevo) => {
          const nombreLimpio = productoNuevo.nombre.trim();
          if (!nombreLimpio) return;
          payload.push({
            id: null,
            nombre: nombreLimpio,
            descripcion: productoNuevo.descripcion.trim() || undefined,
            precio_max: productoNuevo.precio_max
              ? Number(productoNuevo.precio_max)
              : undefined,
            precio_min: productoNuevo.precio_min
              ? Number(productoNuevo.precio_min)
              : undefined,
            tipo_producto_nombre: tipoInfo.nombre,
            categoria_nombre: tipoInfo.categoriaNombre,
          });
        });
      },
    );

    return payload;
  }

  private getProductosEliminados(productosSeleccionados: number[]): number[] {
    const idsActuales = (this.empresa()?.productos ?? [])
      .map((producto) => producto.id)
      .filter((id): id is number => Number.isInteger(id));
    const idsSeleccionados = new Set(productosSeleccionados);
    return idsActuales.filter((id) => !idsSeleccionados.has(id));
  }


  private findCategoriaNombreByTipoId(tipoId?: number): string {
    if (!tipoId) return '';
    const categoriaActiva = this.categorias().find(
      (categoria) =>
        categoria.id === this.categoriaSeleccionadaId() &&
        (categoria.tipos ?? []).some((tipo) => tipo.id === tipoId),
    );
    if (categoriaActiva) {
      return categoriaActiva.nombre ?? '';
    }

    for (const categoria of this.categorias()) {
      if ((categoria.tipos ?? []).some((tipo) => tipo.id === tipoId)) {
        return categoria.nombre ?? '';
      }
    }

    const tipoEmpresa = this.tiposEditablesEmpresa().find((item) => item.tipoId === tipoId);
    return tipoEmpresa?.categoriaNombre ?? '';
  }

  private findTipoById(
    tipoId: number,
  ): { nombre: string; categoriaNombre: string } | null {
    const tipoEmpresa = this.tiposEditablesEmpresa().find(
      (item) => item.tipoId === tipoId,
    );
    if (tipoEmpresa) {
      return {
        nombre: tipoEmpresa.tipoNombre,
        categoriaNombre: tipoEmpresa.categoriaNombre,
      };
    }

    return null;
  }

  private normalizeImageUrl(url?: string): string {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    const apiBase = this.empresaCtx.apiUrl.replace(/\/$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${apiBase}${path}`;
  }

  private cruceContactoValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const email = String(control.get('email')?.value ?? '').trim();
      const telefono = String(control.get('telefono')?.value ?? '').trim();
      return email || telefono ? null : { contactoRequerido: true };
    };
  }
}
