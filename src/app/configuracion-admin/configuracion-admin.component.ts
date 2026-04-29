import { Component, inject, signal } from '@angular/core';
import { EmpresasApiServiceService } from '../Services/Empresas/empresas-api-service.service';
import { Empresa } from '../Interfaces/Empresa';
import { CategoriasApiServiceService } from '../Services/Catergorias/categoria-api-service.service';
import { InfoCategoria } from '../Interfaces/Categoria';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
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
  tiposSeleccionados = signal<number[]>([]);
  galeriaUrls = signal<string[]>([]);
  loadingUpload = signal(false);
  saving = signal(false);
  modoEdicion = signal(false);
  idUser = signal<string>(localStorage.getItem('id')!);
  form = this.fb.group({
    nombre_empresa: ['', [Validators.required, Validators.minLength(2)]],
    tipo_servicio: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required]],
    name: ['', [Validators.required, Validators.minLength(2)]],
    direccion: ['', [Validators.required, Validators.minLength(5)]],
    tiposSeleccionados: this.fb.control<number[]>([], {
      nonNullable: true,
      validators: [this.minSeleccionados(1)]
    }),
  }, { validators: [this.cruceContactoValidator()] });

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
          direccion: empresa.direccion ?? ''
        });
        this.tiposSeleccionados.set(
          [...new Set((empresa.productos ?? []).map((item) => item.tipo_producto.id))]
        );
        this.form.controls.tiposSeleccionados.setValue(this.tiposSeleccionados());
        const fotos = (empresa.fotos ?? [])
          .map((foto) => this.normalizeImageUrl(foto?.url))
          .filter((url): url is string => Boolean(url));
        this.galeriaUrls.set(fotos);

      },
    })
  }

  getCategorias() {
    this.categoriaCtx.getCategorias().subscribe({
      next: (data) => this.categorias.set(data?.data ?? []),
      error: (err) => console.error('Error al cargar categorías', err)
    });
  }

  onTipoToggle(tipoId: number, checked: boolean) {
    const current = new Set(this.tiposSeleccionados());
    checked ? current.add(tipoId) : current.delete(tipoId);
    const seleccionados = Array.from(current);
    this.tiposSeleccionados.set(seleccionados);
    this.form.controls.tiposSeleccionados.setValue(seleccionados);
    this.form.controls.tiposSeleccionados.markAsTouched();
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
        }
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
    const formEmpresa: CreateEmpresa = {
      nombre_empresa: values.nombre_empresa ?? '',
      tipo_servicio: values.tipo_servicio ?? '',
      email: values.email ?? '',
      telefono: values.telefono ?? '',
      name: values.name ?? '',
      password: '',
      poblacion_id: empresa.poblacion?.id ?? 0,
      direccion: values.direccion ?? ''
    };

    this.saving.set(true);
    this.empresaCtx.editEmpresa(String(empresa.id), formEmpresa).subscribe({
      next: (value) => {
        console.log(value)
        this.saving.set(false);
        this.modoEdicion.set(false);
        this.getEmpresa();
      },
      error: (err) => {
        console.error('Error al guardar cambios del perfil', err);
        this.saving.set(false);
      }
    });
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
