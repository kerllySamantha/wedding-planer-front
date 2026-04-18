import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
  NonNullableFormBuilder,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { map, of, startWith, switchMap, tap } from 'rxjs';

import { ServicioFiltrado } from '../Services/servicioFiltrado.service';
import { Categoria } from '../Interfaces/Categoria';
import { CategoriasServiceService } from '../Services/Catergorias/categoria-service.service';
import { RegionsServer } from '../Services/Regiones/regiones-abstract.server';
import { Provincia, Town } from '../Interfaces/CIudades';
import { TiposHttpService } from '../Services/Tipos/tipos-http.service';
import { TipoData } from '../Interfaces/Tipos';

type RegistroEmpresaForm = {
  nombre_empresa: FormControl<string>;
  grupo: FormControl<string>;
  tipos: FormControl<string | null>;
  email: FormControl<string>;
  telefono: FormControl<string>;
  username: FormControl<string>;
  password: FormControl<string>;
  provincia: FormControl<Provincia | null>;
  localidad: FormControl<Town | null>;
  direccion: FormControl<string | null>;
};

@Component({
  selector: 'app-registro-empresas',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './registro-empresas.component.html',
  styleUrl: './registro-empresas.component.scss',
})
export class RegistroEmpresasComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);

  filtradoEmpresctx = inject(ServicioFiltrado);
  regionesServerctx = inject(RegionsServer);
  categoriasctx = inject(CategoriasServiceService);
  tiposCtx = inject(TiposHttpService);

  form!: FormGroup<RegistroEmpresaForm>;

  showPassword = false;
  submitted = false;
  successMessage = '';
  mostrarFiltros = false;
  errorsProvincia = false;

  provincias$ = this.regionesServerctx.getProvincias();

  categorias$ = this.categoriasctx.getCategorias().pipe(
    tap((response) => console.log(response?.data as Categoria[])),
    map((response) => response?.data as Categoria[]),
  );

  poblaciones$ = of([] as Town[]);

  // Todos los tipos traídos del backend
  allTipos = signal<TipoData[]>([]);

  // Tipos filtrados según grupo
  tipos = signal<TipoData[]>([]);

  ngOnInit(): void {
    this.form = new FormGroup<RegistroEmpresaForm>({
      nombre_empresa: this.fb.control('', {
        validators: [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(255),
        ],
      }),
      grupo: this.fb.control('', {
        validators: [Validators.required],
      }),
      tipos: this.fb.control(
        // { value: null, disabled: false },
        '',
        {
          validators: [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(255),
          ],
        },
      ),
      email: this.fb.control('', {
        validators: [
          Validators.required,
          Validators.email,
          Validators.maxLength(255),
        ],
      }),
      telefono: this.fb.control('', {
        validators: [
          Validators.required,
          Validators.pattern(/^[+]?[\d\s\-]{7,15}$/),
        ],
      }),
      username: this.fb.control('', {
        validators: [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(50),
        ],
      }),
      password: this.fb.control('', {
        validators: [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(48),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)\S+$/),
          this.noSpacesValidator,
        ],
      }),
      provincia: new FormControl<Provincia | null>(null, {
        validators: [Validators.required],
      }),
      localidad: new FormControl<Town | null>(
        { value: null, disabled: true },
        {
          validators: [Validators.required],
        },
      ),
      direccion: new FormControl<string | null>(null, {
        validators: [Validators.required],
      }),
    });

    // this.getTipos();

    this.poblaciones$ = this.form.controls.provincia.valueChanges.pipe(
      startWith(this.form.controls.provincia.value),
      tap(() => {
        const localidadCtrl = this.form.controls.localidad;

        localidadCtrl.reset(null, { emitEvent: false });
        localidadCtrl.setErrors(null);
        localidadCtrl.markAsPristine();
        localidadCtrl.markAsUntouched();
        localidadCtrl.disable({ emitEvent: false });

        this.errorsProvincia = false;
      }),
      switchMap((provincia) =>
        provincia
          ? this.regionesServerctx.getTowns(provincia.id).pipe(
              tap((poblaciones) => {
                const localidadCtrl = this.form.controls.localidad;

                if (poblaciones?.length) {
                  localidadCtrl.enable({ emitEvent: false });
                } else {
                  localidadCtrl.disable({ emitEvent: false });
                }
              }),
            )
          : of([]),
      ),
    );
  }

  getTipos(): void {
    this.tiposCtx.getTipos().subscribe({
      next: (data) => {
        const lista = data?.data ?? [];
        this.allTipos.set(lista);
        console.log('Todos los tipos:', this.allTipos());
      },
      error: (err: Error) => {
        console.log(err.message);
      },
    });
  }

  get f() {
    return this.form.controls;
  }

  isInvalid<K extends keyof RegistroEmpresaForm>(field: K): boolean {
    const c = this.form.controls[field];
    return c.invalid && (c.dirty || c.touched || this.submitted);
  }

  isValid<K extends keyof RegistroEmpresaForm>(field: K): boolean {
    const c = this.form.controls[field];
    return c.valid && (c.dirty || c.touched);
  }

  get passwordValue(): string {
    return this.form.controls.password.value;
  }

  get passwordStrength() {
    const password = this.passwordValue;
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (!password) {
      return { label: '', color: '#d1d5db', width: '0%' };
    }

    if (password.length < 8) {
      return { label: 'Muy débil', color: '#dc3545', width: '20%' };
    }

    if (score <= 3) {
      return { label: 'Débil', color: '#dc3545', width: '35%' };
    }

    if (score <= 4) {
      return { label: 'Media', color: '#f59e0b', width: '60%' };
    }

    if (score <= 5) {
      return { label: 'Fuerte', color: '#0d6efd', width: '80%' };
    }

    return { label: 'Muy fuerte', color: '#198754', width: '100%' };
  }

  get strengthWidth(): string {
    return this.passwordStrength.width;
  }

  getError(field: keyof RegistroEmpresaForm): string {
    const c = this.form.controls[field];
    if (!c.errors) return '';

    const messages: Record<string, Record<string, string>> = {
      nombre_empresa: {
        required: 'El nombre de la empresa es obligatorio.',
        minlength: 'Mínimo 2 caracteres.',
        maxlength: 'Máximo 255 caracteres.',
      },
      grupo: {
        required: 'Selecciona un grupo.',
      },
      tipos: {
        required: 'El tipo de empresa es obligatorio.',
      },
      email: {
        required: 'El correo electrónico es obligatorio.',
        email: 'Introduce un correo válido.',
        maxlength: 'Máximo 255 caracteres.',
      },
      telefono: {
        required: 'El teléfono es obligatorio.',
        pattern: 'Introduce un teléfono válido (7–15 dígitos).',
      },
      username: {
        required: 'El nombre de usuario es obligatorio.',
        minlength: 'Mínimo 5 caracteres.',
        maxlength: 'Máximo 50 caracteres.',
      },
      password: {
        required: 'La contraseña es obligatoria.',
        minlength: 'Mínimo 8 caracteres.',
        maxlength: 'Máximo 48 caracteres.',
        pattern: 'Debe tener mayúscula, minúscula y número.',
        noSpaces: 'No puede contener espacios.',
      },
      provincia: {
        required: 'Selecciona una provincia.',
      },
      localidad: {
        required: 'Selecciona una localidad.',
      },
      direccion: {
        required: 'La dirección es obligatoria.',
      },
    };

    const fieldMessages = messages[field] ?? {};
    for (const key of Object.keys(c.errors)) {
      if (fieldMessages[key]) return fieldMessages[key];
    }

    return 'Campo inválido.';
  }

  noSpacesValidator(control: AbstractControl): ValidationErrors | null {
    return /\s/.test(control.value ?? '') ? { noSpaces: true } : null;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    console.log('Datos del formulario:', this.form.getRawValue());
    this.successMessage = '¡Cuenta creada con éxito!';

    setTimeout(() => {
      this.submitted = false;
      this.successMessage = '';
      this.form.reset({
        nombre_empresa: '',
        grupo: '',
        tipos: null,
        email: '',
        telefono: '',
        username: '',
        password: '',
        provincia: null,
        localidad: null,
        direccion: null,
      });

      this.tipos.set([]);
      this.form.controls.tipos.disable();
      this.form.controls.localidad.disable();
    }, 3000);
  }
}
