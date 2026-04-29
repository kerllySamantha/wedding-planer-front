import { Component, inject, signal } from '@angular/core';
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
  empresa = signal<Empresa | null>(null);
  categorias = signal<InfoCategoria[]>([]);
  productosSeleccionados = signal<number[]>([]);
  nuevosProductosPorTipo = signal<Record<number, Array<{ nombre: string; descripcion: string; precio_min: string; precio_max: string }>>>({});
  galeriaUrls = signal<string[]>([]);
  loadingUpload = signal(false);
  saving = signal(false);
  modoEdicion = signal(false);
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
        validators: [this.minSeleccionados(1)],
      }),
    },
    { validators: [this.cruceContactoValidator()] },
  );

  ngOnInit() {
    this.getEmpresa();
    this.getCategorias();
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
        const fotos = (empresa.fotos ?? [])
          .map((foto) => this.normalizeImageUrl(foto?.url))
          .filter((url): url is string => Boolean(url));
        this.galeriaUrls.set(fotos);
      },
    });
  }

  getCategorias() {
    this.categoriaCtx.getCategorias().subscribe({
      next: (data) => this.categorias.set(data?.data ?? []),
      error: (err) => console.error('Error al cargar categorías', err),
    });
  }

  productosAgrupadosPorCategoria(): Array<{ categoria: string; productos: Empresa['productos'] }> {
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
    this.form.controls.productosSeleccionados.markAsTouched();
  }

  productosPorTipo(tipoId: number) {
    return (this.empresa()?.productos ?? []).filter((p) => p.tipo_producto?.id === tipoId);
  }

  tiposPermitidosPorEmpresa(): Array<{ categoriaId: number; categoriaNombre: string; tipoId: number; tipoNombre: string }> {
    const empresaActual = this.empresa();
    if (!empresaActual) return [];

    const tipoIdsEmpresa = new Set(
      (empresaActual.productos ?? [])
        .map((p) => p.tipo_producto?.id)
        .filter((id): id is number => typeof id === 'number')
    );

    if (tipoIdsEmpresa.size === 0) return [];

    const permitidos: Array<{ categoriaId: number; categoriaNombre: string; tipoId: number; tipoNombre: string }> = [];
    for (const categoria of this.categorias()) {
      for (const tipo of categoria.tipos) {
        if (tipoIdsEmpresa.has(tipo.id)) {
          permitidos.push({
            categoriaId: categoria.id,
            categoriaNombre: categoria.nombre,
            tipoId: tipo.id,
            tipoNombre: tipo.nombre,
          });
        }
      }
    }
    return permitidos;
  }

  agregarCampoNuevoProducto(tipoId: number) {
    this.nuevosProductosPorTipo.update((prev) => ({
      ...prev,
      [tipoId]: [...(prev[tipoId] ?? []), { nombre: '', descripcion: '', precio_min: '', precio_max: '' }],
    }));
  }

  onNuevoProductoInput(tipoId: number, idx: number, value: string) {
    this.nuevosProductosPorTipo.update((prev) => {
      const lista = [...(prev[tipoId] ?? [])];
      if (idx < 0 || idx >= lista.length) return prev;
      lista[idx] = { ...lista[idx], nombre: value };
      return { ...prev, [tipoId]: lista };
    });
  }
  onNuevoProductoFieldInput(tipoId: number, idx: number, field: 'descripcion' | 'precio_min' | 'precio_max', value: string) {
    this.nuevosProductosPorTipo.update((prev) => {
      const lista = [...(prev[tipoId] ?? [])];
      if (idx < 0 || idx >= lista.length) return prev;
      lista[idx] = { ...lista[idx], [field]: value };
      return { ...prev, [tipoId]: lista };
    });
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

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result ?? '');
      if (!base64) return;
      this.loadingUpload.set(true);
      this.empresaCtx.uploadImageBase64(base64).subscribe({
        next: (res) => {
          const url = this.normalizeImageUrl(res?.data?.url ?? res?.url);
          if (url) {
            this.galeriaUrls.set([...this.galeriaUrls(), url]);
          }
          this.loadingUpload.set(false);
        },
        error: (err) => {
          console.error('Error al subir imagen', err);
          this.loadingUpload.set(false);
        },
      });
    };
    reader.readAsDataURL(file);
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
    const productosPayload = this.buildProductosPayload(
      values.productosSeleccionados ?? [],
    );
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
      if (!productoExistente) continue;
      payload.push({
        id: productoExistente.id ?? null,
        nombre: productoExistente.nombre ?? productoExistente.tipo_producto?.nombre ?? '',
        descripcion: productoExistente.descripcion ?? '',
        precio_max: productoExistente.precio_max ?? 0,
        precio_min: productoExistente.precio_min ?? 0,
        tipo_producto_nombre: productoExistente.tipo_producto?.nombre ?? '',
        categoria_nombre: productoExistente.categoria?.nombre ?? '',
      });
    }

    Object.entries(this.nuevosProductosPorTipo()).forEach(([tipoIdStr, productos]) => {
      const tipoInfo = this.findTipoById(Number(tipoIdStr));
      if (!tipoInfo) return;
      productos.forEach((productoNuevo) => {
        const nombreLimpio = productoNuevo.nombre.trim();
        if (!nombreLimpio) return;
        payload.push({
          id: null,
          nombre: nombreLimpio,
          descripcion: productoNuevo.descripcion.trim() || undefined,
          precio_max: productoNuevo.precio_max ? Number(productoNuevo.precio_max) : undefined,
          precio_min: productoNuevo.precio_min ? Number(productoNuevo.precio_min) : undefined,
          tipo_producto_nombre: tipoInfo.nombre,
          categoria_nombre: tipoInfo.categoriaNombre,
        });
      });
    });

    return payload;
  }

  private findTipoById(
    tipoId: number,
  ): { nombre: string; categoriaNombre: string } | null {
    for (const categoria of this.categorias()) {
      const tipo = categoria.tipos.find((item) => item.id === tipoId);
      if (tipo) {
        return { nombre: tipo.nombre, categoriaNombre: categoria.nombre };
      }
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

  private minSeleccionados(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value as number[] | null;
      return value && value.length >= min ? null : { minSeleccionados: true };
    };
  }

  private cruceContactoValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const email = String(control.get('email')?.value ?? '').trim();
      const telefono = String(control.get('telefono')?.value ?? '').trim();
      return email || telefono ? null : { contactoRequerido: true };
    };
  }
}
