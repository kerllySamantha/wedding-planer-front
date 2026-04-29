import { Component, inject, signal } from '@angular/core';
import { EmpresasApiServiceService } from '../Services/Empresas/empresas-api-service.service';
import { Empresa } from '../Interfaces/Empresa';
import { CategoriasApiServiceService } from '../Services/Catergorias/categoria-api-service.service';
import { InfoCategoria } from '../Interfaces/Categoria';
import { FormsModule } from '@angular/forms';
import { CreateEmpresa } from '../Interfaces/Empresa';

@Component({
  selector: 'app-configuracion-admin',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './configuracion-admin.component.html',
  styleUrl: './configuracion-admin.component.scss',
})
export class ConfiguracionAdminComponent {

  empresaCtx = inject(EmpresasApiServiceService);
  categoriaCtx = inject(CategoriasApiServiceService);
  empresa = signal<Empresa | null>(null);
  categorias = signal<InfoCategoria[]>([]);
  categoriasSeleccionadas = signal<number[]>([]);
  tiposSeleccionados = signal<number[]>([]);
  galeriaUrls = signal<string[]>([]);
  loadingUpload = signal(false);
  saving = signal(false);
  modoEdicion = signal(false);
  idUser = signal<string>(localStorage.getItem('id')!);
  formEmpresa: CreateEmpresa = {
    nombre_empresa: '',
    tipo_servicio: '',
    email: '',
    telefono: '',
    name: '',
    password: '',
    poblacion_id: 0,
    direccion: ''
  };

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
        this.formEmpresa = {
          nombre_empresa: empresa.nombre_empresa ?? '',
          tipo_servicio: empresa.tipo_servicio ?? '',
          email: empresa.usuario?.email ?? '',
          telefono: empresa.telefono ?? '',
          name: empresa.usuario?.name ?? '',
          password: '',
          poblacion_id: empresa.poblacion?.id ?? 0,
          direccion: empresa.direccion ?? ''
        };
        this.categoriasSeleccionadas.set(
          [...new Set((empresa.productos ?? []).map((item) => item.categoria.id))]
        );
        this.tiposSeleccionados.set(
          [...new Set((empresa.productos ?? []).map((item) => item.tipo_producto.id))]
        );

      },
    })
  }

  getCategorias() {
    this.categoriaCtx.getCategorias().subscribe({
      next: (data) => this.categorias.set(data?.data ?? []),
      error: (err) => console.error('Error al cargar categorías', err)
    });
  }

  onCategoriaToggle(categoriaId: number, checked: boolean) {
    const current = new Set(this.categoriasSeleccionadas());
    checked ? current.add(categoriaId) : current.delete(categoriaId);
    this.categoriasSeleccionadas.set(Array.from(current));
    const tiposValidos = this.tiposVisibles().map((tipo) => tipo.id);
    this.tiposSeleccionados.set(this.tiposSeleccionados().filter((id) => tiposValidos.includes(id)));
  }

  onTipoToggle(tipoId: number, checked: boolean) {
    const current = new Set(this.tiposSeleccionados());
    checked ? current.add(tipoId) : current.delete(tipoId);
    this.tiposSeleccionados.set(Array.from(current));
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
          const url = res?.data?.url ?? res?.url;
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

  tiposVisibles() {
    const selected = new Set(this.categoriasSeleccionadas());
    return this.categorias()
      .filter(cat => selected.has(cat.id))
      .flatMap(cat => cat.tipos ?? []);
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
    this.saving.set(true);
    this.empresaCtx.editEmpresa(String(empresa.id), this.formEmpresa).subscribe({
      next: () => {
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
}
