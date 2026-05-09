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

    const primerProductoEmpresa = this.empresa()?.productos?.[0];
    const categoriaProductoId = primerProductoEmpresa?.categoria?.id;
    const tipoProductoId = primerProductoEmpresa?.tipo_producto?.id;

    let categoriaObjetivoId: number | null = null;

    const categoriaPorId = categorias.find((c) => c.id === categoriaProductoId);
    if (categoriaPorId) categoriaObjetivoId = categoriaPorId.id;

    if (!categoriaObjetivoId && tipoProductoId) {
      const categoriaPorTipo = categorias.find((categoria) =>
        (categoria.tipos ?? []).some((tipo) => tipo.id === tipoProductoId),
      );
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
        next: (response) => this.productosCatalogoGeneral.set(response?.data ?? []),
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
  }

  productosPorTipo(tipoId: number) {
    return this.productosCatalogoGeneral().filter((p) => p.tipo_producto?.id === tipoId);
  }

  unidadPorModalidad(modalidad?: string): string {
    return modalidad === 'servicio' ? 'horas' : 'días';
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

    for (const productoId of productosSeleccionados) {
      const productoExistente = productosActuales.find((p) => p.id === productoId);
      if (productoExistente) {
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
