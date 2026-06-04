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
import { Producto, ProductoEmpresa } from '../Interfaces/Producto';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatProgressBar } from '@angular/material/progress-bar';

@Component({
  selector: 'app-configuracion-admin',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MatProgressBar],
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
        modalidad: string;
      }>
    >
  >({});
  edicionCatalogoPorId = signal<Record<number, { descripcion: string; precio_min: string; precio_max: string }>>({});
  nuevosProductosPorTipo = signal<
    Record<
      number,
      Array<{
        nombre: string;
        descripcion: string;
        precio_min: string;
        precio_max: string;
        modalidad: string;
      }>
    >
  >({});
  galeriaUrls = signal<Foto[]>([]);
  logoUrl = signal<string>('');
  logoEliminado = signal(false);
  fotoPerfilUrl = signal<string>('');
  fotoPerfilPath = signal<string>('');
  fotoPerfilEliminada = signal(false);
  loadingLogo = signal(false);
  empresaSinImagenes = computed(() => (this.empresa()?.fotos?.length ?? 0) === 0);
  loadingUpload = signal(false);
  saving = signal(false);
  modoEdicion = signal(false);
  productosError = signal(false);
  productosRangoError = signal<string | null>(null);
  productosPersonalizadosEliminados = signal<number[]>([]);
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
        this.sincronizarSeleccionConCatalogo();
        this.nuevosProductosPorTipo.set({});
        this.inicializarProductosPersonalizados();
        this.productosPersonalizadosEliminados.set([]);
        const fotos: Foto[] = ((empresa.fotos ?? []) as Foto[])
          .map((foto) => ({
            path: foto.path,
            url: this.normalizeImageUrl(foto.url),
          }))
          .filter((foto) => Boolean(foto.url));

        this.galeriaUrls.set(fotos);
        this.logoUrl.set(this.normalizeImageUrl(empresa.logo ?? ''));
        this.logoEliminado.set(false);
        this.fotoPerfilUrl.set(empresa.usuario?.fotoPerfil ?? '');
        this.fotoPerfilPath.set('');
        this.fotoPerfilEliminada.set(false);
        this.inicializarCategoriaSeleccionada();
      },
    });
  }



  private categoriasConTipos(): InfoCategoria[] {
    return this.categorias().filter((categoria) =>
      (categoria.tipos ?? []).length > 0,
    );
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
    const categorias = this.categoriasConTipos();
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
          this.sincronizarSeleccionConCatalogo();
        },
        error: (err) => {
          console.error('Error al cargar productos globales', err);
          this.productosCatalogoGeneral.set([]);
        },
      });
  }


  private sincronizarSeleccionConCatalogo() {
    const productosEmpresa = this.empresa()?.productos ?? [];
    const catalogo = this.productosCatalogoGeneral();

    const catalogoPorKey = new Map<string, Producto>();
    catalogo.forEach((producto) => {
      if (!producto.id) return;
      const key = this.productoComparableKey(producto);
      if (!catalogoPorKey.has(key)) catalogoPorKey.set(key, producto);
    });

    const seleccionados = new Set<number>();

    productosEmpresa.forEach((productoEmpresa) => {
      if (!productoEmpresa.id) return;
      const key = this.productoComparableKey(productoEmpresa);
      const equivalenteCatalogo = catalogoPorKey.get(key);
      if (equivalenteCatalogo?.id) {
        seleccionados.add(equivalenteCatalogo.id);
      }
    });

    const seleccion = Array.from(seleccionados);
    this.productosSeleccionados.set(seleccion);
    this.form.controls.productosSeleccionados.setValue(seleccion);
  }

  productosAgrupadosPorCategoria(): Array<{
    categoria: string;
    productos: Empresa['productos'];
  }> {
    const productos = this.empresa()?.productos ?? [];
    const map = new Map<string, Empresa['productos']>();
    const vistosPorCategoria = new Map<string, Set<string>>();

    productos.forEach((p) => {
      const categoria = p.categoria?.nombre ?? 'Sin categoría';
      const actual = map.get(categoria) ?? [];
      const vistos = vistosPorCategoria.get(categoria) ?? new Set<string>();
      const key = this.productoComparableKey(p);
      if (!vistos.has(key)) {
        actual.push(p);
        vistos.add(key);
      }
      map.set(categoria, actual);
      vistosPorCategoria.set(categoria, vistos);
    });

    return Array.from(map.entries()).map(([categoria, productosCategoria]) => ({
      categoria,
      productos: productosCategoria,
    }));
  }


  private resolverIdCatalogo(productoId: number): number {
    const producto = this.productosCatalogoGeneral().find((p) => p.id === productoId)
      ?? this.empresa()?.productos.find((p) => p.id === productoId);
    if (!producto) return productoId;

    const key = this.productoComparableKey(producto as ProductoEmpresa | Producto);
    const equivalenteCatalogo = this.productosCatalogoGeneral().find(
      (item) => this.productoComparableKey(item) === key,
    );
    return equivalenteCatalogo?.id ?? productoId;
  }

  isProductoMarcado(productoId: number): boolean {
    const idCatalogo = this.resolverIdCatalogo(productoId);
    return this.productosSeleccionados().includes(idCatalogo);
  }


  productosSeleccionadosPorTipo(tipoId: number): Producto[] {
    const seleccionados = new Set(this.productosSeleccionados());
    return this.productosPorTipo(tipoId).filter((producto) => seleccionados.has(this.resolverIdCatalogo(producto.id)));
  }

  datosEdicionCatalogo(producto: Producto): { descripcion: string; precio_min: string; precio_max: string } {
    const id = this.resolverIdCatalogo(producto.id);
    const actual = this.edicionCatalogoPorId()[id];
    if (actual) return actual;
    const empresaMatch = (this.empresa()?.productos ?? []).find(
      (item) => this.productoComparableKey(item) === this.productoComparableKey(producto),
    );
    return {
      descripcion: empresaMatch?.descripcion ?? producto.descripcion ?? '',
      precio_min: String(empresaMatch?.precio_min ?? producto.precio_min ?? ''),
      precio_max: String(empresaMatch?.precio_max ?? producto.precio_max ?? ''),
    };
  }

  onEdicionCatalogoInput(producto: Producto, field: 'descripcion' | 'precio_min' | 'precio_max', value: string) {
    const id = this.resolverIdCatalogo(producto.id);
    const current = this.datosEdicionCatalogo(producto);
    this.edicionCatalogoPorId.update((prev: Record<number, { descripcion: string; precio_min: string; precio_max: string }>) => ({ ...prev, [id]: { ...current, [field]: value } }));
  }

  onProductoToggle(productoId: number, checked: boolean) {
    const idCatalogo = this.resolverIdCatalogo(productoId);
    const current = new Set(this.productosSeleccionados());
    checked ? current.add(idCatalogo) : current.delete(idCatalogo);
    const seleccionados = Array.from(current);
    this.productosSeleccionados.set(seleccionados);
    this.form.controls.productosSeleccionados.setValue(seleccionados);
    this.productosError.set(false);
    this.productosRangoError.set(null);
  }

  productosPorTipo(tipoId: number): Producto[] {
    return this.productosCatalogoGeneral().filter(
      (p) => p.tipo_producto?.id === tipoId,
    );
  }


  productoTrackKey(producto: Producto): string {
    return `${producto.id ?? 0}::${this.productoComparableKey(producto)}`;
  }

  private normalizarTexto(valor: string): string {
    return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  }

  private productoComparableKey(producto: ProductoEmpresa | Producto): string {
    const tipoIdNumerico = Number(producto.tipo_producto?.id ?? 0);
    const tipoNombre = this.normalizarTexto(producto.tipo_producto?.nombre ?? '');
    const tipoKey = Number.isFinite(tipoIdNumerico) && tipoIdNumerico > 0
      ? `id:${tipoIdNumerico}`
      : `name:${tipoNombre}`;
    const nombre = this.normalizarTexto(producto.nombre ?? '');
    return `${tipoKey}::${nombre}`;
  }

  unidadPorModalidad(modalidad?: string): string {
    return modalidad === 'servicio' ? 'horas' : 'días';
  }



  private inicializarProductosPersonalizados() {
    const catalogoIds = new Set(this.productosCatalogoGeneral().map((p) => p.id));
    const catalogoKeys = new Set(
      this.productosCatalogoGeneral().map((producto) => this.productoComparableKey(producto)),
    );
    const porTipo: Record<number, Array<{ id: number; nombre: string; descripcion: string; precio_min: string; precio_max: string; modalidad: string }>> = {};
    const porTipoKeys = new Map<number, Set<string>>();

    for (const producto of this.empresa()?.productos ?? []) {
      const tipoId = producto.tipo_producto?.id;
      if (!tipoId) continue;

      const comparableKey = this.productoComparableKey(producto);
      const tipoIdProducto = Number(producto.tipo_producto?.id ?? 0);
      const existeTipoEnCatalogo = this.productosCatalogoGeneral().some(
        (itemCatalogo) => Number(itemCatalogo.tipo_producto?.id ?? 0) === tipoIdProducto,
      );
      const existeEnCatalogo =
        catalogoIds.has(producto.id) || catalogoKeys.has(comparableKey) || existeTipoEnCatalogo;
      if (existeEnCatalogo) continue;

      const vistosTipo = porTipoKeys.get(tipoId) ?? new Set<string>();
      if (vistosTipo.has(comparableKey)) continue;
      vistosTipo.add(comparableKey);
      porTipoKeys.set(tipoId, vistosTipo);

      porTipo[tipoId] = porTipo[tipoId] ?? [];
      porTipo[tipoId].push({
        id: producto.id,
        nombre: producto.nombre ?? '',
        descripcion: producto.descripcion ?? '',
        precio_min: String(producto.precio_min ?? ''),
        precio_max: String(producto.precio_max ?? ''),
        modalidad: (producto as any).modalidad ?? producto.tipo_producto?.modalidad ?? 'servicio',
      });
    }
    this.productosPersonalizados.set(porTipo);
  }

  onProductoPersonalizadoFieldInput(
    tipoId: number,
    idx: number,
    field: 'nombre' | 'descripcion' | 'precio_min' | 'precio_max' | 'modalidad',
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
    return this.categoriasConTipos();
  }

  tiposEditablesPorCategoriaEmpresa(): Array<{
    categoriaNombre: string;
    tipos: Array<{ tipoId: number; tipoNombre: string }>;
  }> {
    const categoriaSeleccionada = this.categoriasConTipos().find(
      (c) => c.id === this.categoriaSeleccionadaId(),
    );
    if (!categoriaSeleccionada) return [];

    const mapTipos = new Map<number, { tipoId: number; tipoNombre: string }>();

    (categoriaSeleccionada.tipos ?? []).forEach((tipo) => {
      mapTipos.set(tipo.id, { tipoId: tipo.id, tipoNombre: tipo.nombre });
    });

    (this.empresa()?.productos ?? []).forEach((producto) => {
      const categoriaProducto = producto.categoria?.nombre ?? 'Sin categoría';
      if (categoriaProducto !== (categoriaSeleccionada.nombre ?? 'Sin categoría')) return;
      const tipo = producto.tipo_producto;
      if (!tipo?.id) return;
      if (!mapTipos.has(tipo.id)) {
        mapTipos.set(tipo.id, { tipoId: tipo.id, tipoNombre: tipo.nombre });
      }
    });

    return [{
      categoriaNombre: categoriaSeleccionada.nombre ?? 'Sin categoría',
      tipos: Array.from(mapTipos.values()),
    }];
  }

  agregarCampoNuevoProducto(tipoId: number) {
    this.nuevosProductosPorTipo.update((prev) => ({
      ...prev,
      [tipoId]: [
        ...(prev[tipoId] ?? []),
        { nombre: '', descripcion: '', precio_min: '', precio_max: '', modalidad: 'servicio' },
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
    field: 'descripcion' | 'precio_min' | 'precio_max' | 'modalidad',
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

  async eliminarProductoPersonalizado(tipoId: number, idx: number) {
    const result = await Swal.fire({
      title: '¿Quitar producto?',
      text: 'Este producto se eliminará de tu configuración al guardar cambios.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    this.productosPersonalizados.update((prev) => {
      const lista = [...(prev[tipoId] ?? [])];
      if (idx < 0 || idx >= lista.length) return prev;
      const [eliminado] = lista.splice(idx, 1);
      if (Number.isInteger(eliminado?.id) && (eliminado?.id ?? 0) > 0) {
        this.productosPersonalizadosEliminados.update((ids) =>
          ids.includes(eliminado.id) ? ids : [...ids, eliminado.id],
        );
      }
      return { ...prev, [tipoId]: lista };
    });
  }

  eliminarFoto(url: string): void {
    this.galeriaUrls.update(fotos => fotos.filter(f => f.url !== url));
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
          console.error('Error al subir imagen:', err);
          this.loadingUpload.set(false);
        },
      });
    };
    reader.readAsDataURL(file);
  }

  onLogoSelected(event: Event) {
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
      this.loadingLogo.set(true);
      this.empresaCtx.uploadImageBase64(base64, extension, userId).subscribe({
        next: (res) => {
          const url = this.normalizeImageUrl(res?.url ?? '');
          if (url) {
            this.logoUrl.set(url);
            this.logoEliminado.set(false);
          }
          this.loadingLogo.set(false);
        },
        error: () => this.loadingLogo.set(false),
      });
    };
    reader.readAsDataURL(file);
  }

  onFotoPerfilSelected(event: Event) {
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
      this.empresaCtx.uploadImageBase64(base64, extension, userId).subscribe({
        next: (res) => {
          if (res?.path) this.fotoPerfilPath.set(res.path);
          if (res?.url) {
            this.fotoPerfilUrl.set(this.normalizeImageUrl(res.url));
            this.fotoPerfilEliminada.set(false);
          }
        },
        error: (err) => console.error('Error al subir foto de perfil:', err),
      });
    };
    reader.readAsDataURL(file);
  }


  eliminarLogo() {
    this.logoUrl.set('');
    this.logoEliminado.set(true);
  }

  eliminarFotoPerfil() {
    this.fotoPerfilUrl.set('');
    this.fotoPerfilPath.set('');
    this.fotoPerfilEliminada.set(true);
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
    const eliminadosDetectados = this.getProductosEliminados(values.productosSeleccionados ?? []);
    const productosEliminados = Array.from(new Set([
      ...eliminadosDetectados,
      ...this.productosPersonalizadosEliminados(),
    ]));
    const eliminadosSet = new Set(productosEliminados);
    const productosPayloadFiltrado = productosPayload.filter((producto) => {
      const productoId = producto.id!;
      if (!Number.isInteger(productoId)) return true;
      return !eliminadosSet.has(productoId);
    });

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
      logo: this.logoEliminado() ? '' : this.logoUrl() || empresa.logo || '',
      fotos: this.galeriaUrls(),
      productos: productosPayloadFiltrado,
      productos_eliminados: productosEliminados,
      ...(this.fotoPerfilPath() || this.fotoPerfilEliminada()
        ? { fotoPerfil: this.fotoPerfilEliminada() ? '' : this.fotoPerfilPath() }
        : {}),
    };

    console.log('Payload enviado a /api/empresas/:id', formEmpresa);
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
    const catalogoPorId = new Map(
      this.productosCatalogoGeneral()
        .filter((producto) => Boolean(producto.id))
        .map((producto) => [producto.id, producto]),
    );
    const productosEmpresaPorKey = new Map<string, ProductoEmpresa>();
    productosActuales.forEach((producto) => {
      const key = this.productoComparableKey(producto);
      if (!productosEmpresaPorKey.has(key)) {
        productosEmpresaPorKey.set(key, producto);
      }
    });

    const personalizadosIds = new Set(
      Object.values(this.productosPersonalizados())
        .flat()
        .map((item) => item.id),
    );

    for (const productoId of productosSeleccionados) {
      const productoExistente = productosActuales.find((p) => p.id === productoId);
      if (productoExistente && !personalizadosIds.has(productoId)) {
        const catalogoMatch = catalogoPorId.get(productoExistente.id);
        const perteneceAOtraEmpresa =
          Boolean(catalogoMatch?.empresa?.id) &&
          catalogoMatch?.empresa?.id !== empresaActual?.id;
        payload.push({
          id: perteneceAOtraEmpresa ? null : (productoExistente.id ?? null),
          nombre:
            productoExistente.nombre ??
            productoExistente.tipo_producto?.nombre ??
            '',
          descripcion: productoExistente.descripcion ?? '',
          precio_max: productoExistente.precio_max ?? 0,
          precio_min: productoExistente.precio_min ?? 0,
          modalidad: (productoExistente as any).modalidad ?? productoExistente.tipo_producto?.modalidad ?? 'servicio',
          tipo_producto_id: productoExistente.tipo_producto?.id ?? undefined,
          tipo_producto_nombre: productoExistente.tipo_producto?.nombre ?? '',
          categoria_nombre: productoExistente.categoria?.nombre ?? '',
        });
        continue;
      }

      const productoCatalogo = this.productosCatalogoGeneral().find(
        (p) => p.id === productoId,
      );
      if (!productoCatalogo) continue;

      const keyCatalogo = this.productoComparableKey(productoCatalogo);
      const productoEmpresaEquivalente = productosEmpresaPorKey.get(keyCatalogo);
      if (productoEmpresaEquivalente) {
        payload.push({
          id: productoEmpresaEquivalente.id ?? null,
          nombre:
            productoEmpresaEquivalente.nombre ??
            productoEmpresaEquivalente.tipo_producto?.nombre ??
            productoCatalogo.nombre ??
            '',
          descripcion:
            productoEmpresaEquivalente.descripcion ?? productoCatalogo.descripcion ?? '',
          precio_max:
            productoEmpresaEquivalente.precio_max ?? productoCatalogo.precio_max ?? 0,
          precio_min:
            productoEmpresaEquivalente.precio_min ?? productoCatalogo.precio_min ?? 0,
          modalidad:
            (productoEmpresaEquivalente as any).modalidad ??
            productoEmpresaEquivalente.tipo_producto?.modalidad ??
            productoCatalogo.tipo_producto?.modalidad ??
            'servicio',
          tipo_producto_id:
            productoEmpresaEquivalente.tipo_producto?.id ?? productoCatalogo.tipo_producto?.id ?? undefined,
          tipo_producto_nombre:
            productoEmpresaEquivalente.tipo_producto?.nombre ??
            productoCatalogo.tipo_producto?.nombre ??
            '',
          categoria_nombre:
            productoEmpresaEquivalente.categoria?.nombre ??
            this.findCategoriaNombreByTipoId(productoCatalogo.tipo_producto?.id),
        });
        continue;
      }

      const edicionCatalogo = this.edicionCatalogoPorId()[productoCatalogo.id ?? 0];
      payload.push({
        id: productoCatalogo.id ?? null,
        nombre: productoCatalogo.nombre ?? '',
        descripcion: edicionCatalogo?.descripcion ?? productoCatalogo.descripcion ?? '',
        precio_max: edicionCatalogo?.precio_max ? Number(edicionCatalogo.precio_max) : (productoCatalogo.precio_max ?? 0),
        precio_min: edicionCatalogo?.precio_min ? Number(edicionCatalogo.precio_min) : (productoCatalogo.precio_min ?? 0),
        modalidad: (productoCatalogo as any).modalidad ?? productoCatalogo.tipo_producto?.modalidad ?? 'servicio',
        tipo_producto_id: productoCatalogo.tipo_producto?.id ?? undefined,
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
          id: productoEditado.id ?? null,
          nombre: nombreLimpio,
          descripcion: productoEditado.descripcion.trim() || undefined,
          precio_max: productoEditado.precio_max ? Number(productoEditado.precio_max) : undefined,
          precio_min: productoEditado.precio_min ? Number(productoEditado.precio_min) : undefined,
          modalidad: productoEditado.modalidad || 'servicio',
          tipo_producto_id: Number(tipoIdStr),
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
            modalidad: productoNuevo.modalidad || 'servicio',
            tipo_producto_id: Number(tipoIdStr),
            tipo_producto_nombre: tipoInfo.nombre,
            categoria_nombre: tipoInfo.categoriaNombre,
          });
        });
      },
    );

    const payloadUnico = new Map<string, (typeof payload)[number]>();
    payload.forEach((producto) => {
      const tipoId = Number(producto.tipo_producto_id ?? 0);
      const tipo = (producto.tipo_producto_nombre ?? '').trim().toLowerCase();
      const nombre = this.normalizarTexto(producto.nombre ?? '');
      const key = `${tipoId > 0 ? `id:${tipoId}` : `name:${tipo}`}::${nombre}`;
      if (!payloadUnico.has(key)) payloadUnico.set(key, producto);
    });

    return Array.from(payloadUnico.values());
  }

  private getProductosEliminados(productosSeleccionados: number[]): number[] {
    const empresaId = this.empresa()?.id;
    const productosEmpresa = this.empresa()?.productos ?? [];
    const idsSeleccionados = new Set(productosSeleccionados);

    const catalogoPorKey = new Map<string, Producto>();
    this.productosCatalogoGeneral().forEach((producto) => {
      const key = this.productoComparableKey(producto);
      if (!catalogoPorKey.has(key)) catalogoPorKey.set(key, producto);
    });

    const keysSeleccionadas = new Set<string>();
    productosSeleccionados.forEach((id) => {
      const productoCatalogo = this.productosCatalogoGeneral().find((producto) => producto.id === id);
      if (productoCatalogo) {
        keysSeleccionadas.add(this.productoComparableKey(productoCatalogo));
      }
    });

    return productosEmpresa
      .filter((producto) => {
        const key = this.productoComparableKey(producto);
        const matchCatalogo = catalogoPorKey.get(key);
        const esPropioEmpresa =
          Boolean(matchCatalogo?.empresa?.id) && matchCatalogo?.empresa?.id === empresaId;

        // Solo eliminamos IDs propios de la empresa.
        if (!esPropioEmpresa) return false;
        if (idsSeleccionados.has(producto.id)) return false;
        if (keysSeleccionadas.has(key)) return false;
        return true;
      })
      .map((producto) => producto.id)
      .filter((id): id is number => Number.isInteger(id));
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
