import { Component, inject, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormControl, FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
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


@Component({
  selector: 'app-filtro-proveedores',
  standalone: true,
  imports: [AsyncPipe, CommonModule, ReactiveFormsModule, MatSlideToggleModule, FormsModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatSlideToggleModule, MatIconModule, MatButtonModule

  ],
  templateUrl: './filtro-proveedores.component.html',
  styleUrl: './filtro-proveedores.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class FiltroProveedoresComponent {

  filtradoEmpresctx = inject(ServicioFiltrado);
  regionesServerctx = inject(RegionsServer)
  categoriasctx = inject(CategoriasServiceService);
  private _formBuilder = inject(FormBuilder);
  // serviciosctx = inject(ServiciosServiceService);
  mostrarFiltros = false;


  // isChecked = true;
  formGroup = this._formBuilder.group({
    enableWifi: '',
    acceptTerms: ['', Validators.requiredTrue],
  });

  form = new FormGroup({
    nombre: new FormControl<string | null>(''),
    provincia: new FormControl<Provincia | null>(null),
    localidad: new FormControl<Town| null>(null),
    vacantes: new FormControl(null),
    categoria: new FormControl<Categoria | null>(null),
    // servicio: new FormControl<Servicio | null>(null)
  });

  provincias$ = this.regionesServerctx.getProvincias();
  categorias$ = this.categoriasctx.getCategorias().pipe(
    tap(response => console.log(response?.data as Categoria[])),
    map(response => response?.data as Categoria[])
  );

  // servicios$ = this.serviciosctx.getServicios().pipe(
  //   tap(response => console.log(response?.data as Servicio[])),
  //   map(response => response?.data as Servicio[])
  // );

  errorsProvincia: boolean = false;

  poblaciones$ = this.form.controls.provincia.valueChanges.pipe(
    switchMap(provincia => {
      return provincia ? this.regionesServerctx.getTowns(provincia.id) : of([]);
    })
  );


  ngOnInit() {

  }

  onReset() {
    this.form.reset({
      nombre: '',
      provincia: null,
      localidad: null,
      categoria: null,
    });


    this.filtradoEmpresctx.setFilters({
      nombre: " ",
      provincia: undefined,
      poblacion: undefined,
      categoria: undefined,
    });
  }


  submit(event: Event) {
    event.preventDefault();

    const formData = {
      nombre: this.form.controls.nombre?.value ?? '',
      provincia: this.form.controls.provincia.value?.id ?? 0,
      ciudad: this.form.controls.localidad.value?.id,
      categoria: this.form.controls.categoria.value?.id,
      // servicio: this.form.controls.servicio.value?.id


    };

    console.log(formData)

    this.filtradoEmpresctx.setFilters(formData);
  }

}
