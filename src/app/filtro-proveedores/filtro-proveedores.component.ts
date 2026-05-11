import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import {
  FormGroup,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { tap, map, switchMap, of } from 'rxjs';
import { Categoria } from '../Interfaces/Categoria';
import { CategoriasServiceService } from '../Services/Catergorias/categoria-service.service';
import { ServicioFiltrado } from '../Services/servicioFiltrado.service';
import { RegionsServer } from '../Services/Regiones/regiones-abstract.server';
import { Provincia, Town } from '../Interfaces/CIudades';
import { AsyncPipe, CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TipoData } from '../Interfaces/Tipos';
import { TiposHttpService } from '../Services/Tipos/tipos-http.service';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-filtro-proveedores',
  standalone: true,
  imports: [
    AsyncPipe,
    CommonModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
  ],
  templateUrl: './filtro-proveedores.component.html',
  styleUrl: './filtro-proveedores.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class FiltroProveedoresComponent {
  filtradoEmpresctx = inject(ServicioFiltrado);
  regionesServerctx = inject(RegionsServer);
  categoriasctx = inject(CategoriasServiceService);
  private _formBuilder = inject(FormBuilder);
  tiposCtx = inject(TiposHttpService);
  allTipos = signal<TipoData[]>([]);
  tiposSeleccionadosPorCategoria = signal<Record<number, Set<number>>>({});

  formGroup = this._formBuilder.group({
    enableWifi: '',
    acceptTerms: ['', Validators.requiredTrue],
  });

  form = new FormGroup({
    nombre: new FormControl<string | null>(''),
    provincia: new FormControl<Provincia | null>(null),
    localidad: new FormControl<Town | null>(null),
    vacantes: new FormControl(null),
    categoria: new FormControl<Categoria | null>(null),
  });

  provincias$ = this.regionesServerctx.getProvincias();
  categorias$ = this.categoriasctx.getCategorias().pipe(
    tap((response) => console.log(response?.data as Categoria[])),
    map((response) => response?.data as Categoria[]),
  );

  poblaciones$ = this.form.controls.provincia.valueChanges.pipe(
    switchMap((provincia) => {
      return provincia ? this.regionesServerctx.getTowns(provincia.id) : of([]);
    }),
  );

  ngOnInit() {
    this.getTipos();
  }

  tiposFiltradosPorCategoria(categoriaId: number | null | undefined): TipoData[] {
    if (!categoriaId) return [];
    return this.allTipos().filter((tipo) => tipo.categoria?.id === categoriaId);
  }

  isTipoSeleccionado(tipoId: number, categoriaId: number | null | undefined): boolean {
    if (!categoriaId) return false;
    return this.tiposSeleccionadosPorCategoria()[categoriaId]?.has(tipoId) ?? false;
  }

  onTipoCheckboxChange(categoriaId: number | null | undefined, tipoId: number, checked: boolean): void {
    if (!categoriaId) return;

    this.tiposSeleccionadosPorCategoria.update((state) => {
      const next: Record<number, Set<number>> = { ...state };
      const selected = new Set(next[categoriaId] ?? []);

      if (checked) {
        selected.add(tipoId);
      } else {
        selected.delete(tipoId);
      }

      if (selected.size) {
        next[categoriaId] = selected;
      } else {
        delete next[categoriaId];
      }

      return next;
    });
  }

  private getTiposSeleccionadosIds(): number[] {
    return Object.values(this.tiposSeleccionadosPorCategoria()).flatMap((tiposSet) => Array.from(tiposSet));
  }

  getTipos(): void {
    this.tiposCtx.getTipos().subscribe({
      next: (data) => {
        const lista = data?.data ?? [];
        this.allTipos.set(lista);
      },
      error: (err: Error) => {
        console.log(err.message);
      },
    });
  }

  onReset() {
    this.form.reset({
      nombre: '',
      provincia: null,
      localidad: null,
      categoria: null,
    });
    this.tiposSeleccionadosPorCategoria.set({});

    this.filtradoEmpresctx.setFilters({
      nombre: ' ',
      provincia: undefined,
      poblacion: undefined,
      categoria: undefined,
      tipos: undefined,
    });
  }

  submit(event: Event) {
    event.preventDefault();

    const tiposSeleccionados = this.getTiposSeleccionadosIds();
    const categoriasConTiposSeleccionados = Object.keys(this.tiposSeleccionadosPorCategoria()).map(Number);
    const categoriaSeleccionada = this.form.controls.categoria.value?.id;

    const formData = {
      nombre: this.form.controls.nombre?.value ?? '',
      provincia: this.form.controls.provincia.value?.id ?? 0,
      ciudad: this.form.controls.localidad.value?.id,
      categoria: tiposSeleccionados.length
        ? (categoriasConTiposSeleccionados.length === 1 ? categoriasConTiposSeleccionados[0] : undefined)
        : categoriaSeleccionada,
      tipos: tiposSeleccionados.length ? tiposSeleccionados : undefined,
    };

    this.filtradoEmpresctx.setFilters(formData);
  }
}
