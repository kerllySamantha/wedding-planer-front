import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
  NonNullableFormBuilder,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap, tap, throwError } from 'rxjs';

import { ServicioFiltrado } from '../Services/servicioFiltrado.service';
import { Categoria } from '../Interfaces/Categoria';
import { CategoriasServiceService } from '../Services/Catergorias/categoria-service.service';
import { RegionsServer } from '../Services/Regiones/regiones-abstract.server';
import { Provincia, Town } from '../Interfaces/CIudades';
import { TiposHttpService } from '../Services/Tipos/tipos-http.service';
import { TipoData } from '../Interfaces/Tipos';
import { CreateEmpresa } from '../Interfaces/Empresa';
import { EmpresasServiceServiceService } from '../Services/Empresas/empresas-service-service.service';
import { AuthenticationService } from '../Services/Autentication/authenticationService';
 // ajusta la ruta si cambia

type RegistroEmpresaForm = {
  nombre_empresa: FormControl<string>;
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
  private router = inject(Router);

  filtradoEmpresctx = inject(ServicioFiltrado);
  regionesServerctx = inject(RegionsServer);
  categoriasctx = inject(CategoriasServiceService);
  tiposCtx = inject(TiposHttpService);
  empresaCtx = inject(EmpresasServiceServiceService);
  authServicectx = inject(AuthenticationService);

  form!: FormGroup<RegistroEmpresaForm>;

  showPassword = false;
  submitted = false;
  loading = false;

  successMessage = '';
  generalError = '';
  serverErrors: string[] = [];

  mostrarFiltros = false;
  errorsProvincia = false;

  provincias$ = this.regionesServerctx.getProvincias();

  categorias$ = this.categoriasctx.getCategorias().pipe(
    tap((response) => console.log(response?.data as Categoria[])),
    map((response) => response?.data as Categoria[]),
  );

  poblaciones$ = of([] as Town[]);

  allTipos = signal<TipoData[]>([]);
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

      tipos: this.fb.control('', {
        validators: [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(255),
        ],
      }),

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

    if (c.errors['server']) {
      return c.errors['server'];
    }

    const messages: Record<string, Record<string, string>> = {
      nombre_empresa: {
        required: 'El nombre de la empresa es obligatorio.',
        minlength: 'Mínimo 2 caracteres.',
        maxlength: 'Máximo 255 caracteres.',
      },
      tipos: {
        required: 'El tipo de empresa es obligatorio.',
        minlength: 'Mínimo 2 caracteres.',
        maxlength: 'Máximo 255 caracteres.',
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
      if (fieldMessages[key]) {
        return fieldMessages[key];
      }
    }

    return 'Campo inválido.';
  }

  noSpacesValidator(control: AbstractControl): ValidationErrors | null {
    return /\s/.test(control.value ?? '') ? { noSpaces: true } : null;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  private clearServerErrors(): void {
    this.generalError = '';
    this.serverErrors = [];

    Object.keys(this.form.controls).forEach((key) => {
      const control = this.form.controls[key as keyof RegistroEmpresaForm];

      if (control.errors?.['server']) {
        const currentErrors = { ...(control.errors || {}) };
        delete currentErrors['server'];
        control.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
      }
    });
  }

  private mapBackendFieldToFormField(
    field: string,
  ): keyof RegistroEmpresaForm | null {
    const fieldMap: Record<string, keyof RegistroEmpresaForm> = {
      nombre_empresa: 'nombre_empresa',
      email: 'email',
      telefono: 'telefono',
      username: 'username',
      name: 'username',
      password: 'password',
      provincia: 'provincia',
      localidad: 'localidad',
      poblacion_id: 'localidad',
      direccion: 'direccion',
      tipo_servicio: 'tipos',
      tipos: 'tipos',
    };

    return fieldMap[field] ?? null;
  }

  private applyServerValidationErrors(error: HttpErrorResponse): void {
    this.clearServerErrors();

    const backendErrors = error.error?.errors;
    const backendMessage = error.error?.message;

    if (backendErrors && typeof backendErrors === 'object') {
      Object.entries(backendErrors).forEach(([backendField, messages]) => {
        const formField = this.mapBackendFieldToFormField(backendField);
        const firstMessage = Array.isArray(messages)
          ? String(messages[0])
          : String(messages);

        if (formField) {
          const control = this.form.controls[formField];
          control.setErrors({
            ...(control.errors || {}),
            server: firstMessage,
          });
          control.markAsTouched();
        }

        if (Array.isArray(messages)) {
          this.serverErrors.push(...messages.map(String));
        } else {
          this.serverErrors.push(String(messages));
        }
      });

      this.generalError =
        typeof backendMessage === 'string' && backendMessage.trim()
          ? backendMessage
          : 'Por favor, revisa los errores del formulario.';
      return;
    }

    if (typeof backendMessage === 'string' && backendMessage.trim()) {
      this.generalError = backendMessage;
      this.serverErrors = [backendMessage];
      return;
    }

    if (error.status === 0) {
      this.generalError = 'No se pudo conectar con el servidor.';
      return;
    }

    if (error.status >= 500) {
      this.generalError = 'Ha ocurrido un error interno del servidor.';
      return;
    }

    this.generalError = 'No se pudo completar el registro.';
  }

  private doLoginAfterRegister(email: string, password: string): void {
    this.authServicectx
      .login(email, password)
      .pipe(
        tap((response: any) => {
          localStorage.setItem('user', JSON.stringify(response.data));
          localStorage.setItem('id', response.data.id.toString());
          localStorage.setItem('rol', response.data.rol);
          localStorage.setItem('token', response.token);
          this.authServicectx['auth'].set(response.data);
        }),
        switchMap((response: any) => {
          if (response?.data?.rol !== 'empresa') {
            this.generalError = 'Las credenciales ingresadas no son correctas.';
            throw new Error('Rol incorrecto');
          }

          return this.empresaCtx.getEmpresaByUser(response.data.id!);
        }),
      )
      .subscribe({
        next: (empresaResponse: any) => {
          this.loading = false;

          localStorage.setItem('empresa', JSON.stringify(empresaResponse?.data));
          localStorage.setItem('idEmpresa', JSON.stringify(empresaResponse?.data?.id));

          this.successMessage = '¡Cuenta creada con éxito!';
          this.router.navigate(['proveedor-dashboard']);
        },
        error: (err: any) => {
          this.loading = false;
          this.successMessage = '';
          this.generalError =
            err?.error?.message ??
            err?.message ??
            'La cuenta se creó, pero no se pudo iniciar sesión automáticamente.';
          console.error('Error en el flujo:', err);
        },
      });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted = true;
    this.loading = true;
    this.successMessage = '';
    this.clearServerErrors();

    if (this.form.invalid) {
      this.loading = false;
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.value.email!;
    const password = this.form.value.password!;

    const register: CreateEmpresa = {
      nombre_empresa: this.form.value.nombre_empresa!,
      email,
      tipo_servicio: this.form.value.tipos!,
      direccion: this.form.value.direccion!,
      password,
      name: this.form.value.username!,
      poblacion_id: this.form.value.localidad?.id!,
      telefono: this.form.value.telefono!,
    };

    this.empresaCtx
      .postEmpresa(register)
      .pipe(
        switchMap(() => {
          return this.authServicectx.login(email, password);
        }),
        tap((response: any) => {
          localStorage.setItem('user', JSON.stringify(response.data));
          localStorage.setItem('id', response.data.id.toString());
          localStorage.setItem('rol', response.data.rol);
          localStorage.setItem('token', response.token);
          this.authServicectx['auth'].set(response.data);
        }),
        switchMap((response: any) => {
          if (response?.data?.rol !== 'empresa') {
            throw new Error('Rol incorrecto');
          }

          return this.empresaCtx.getEmpresaByUser(response.data.id!);
        }),
        catchError((err) => {
          if (err instanceof HttpErrorResponse) {
            this.applyServerValidationErrors(err);
          } else {
            this.generalError =
              err?.message ??
              'La cuenta se creó, pero no se pudo completar el inicio de sesión.';
          }

          this.loading = false;
          return throwError(() => err);
        }),
      )
      .subscribe({
        next: (empresaResponse: any) => {
          this.loading = false;
          this.generalError = '';
          this.serverErrors = [];
          this.successMessage = '¡Cuenta creada con éxito!';

          localStorage.setItem('empresa', JSON.stringify(empresaResponse?.data));
          localStorage.setItem('idEmpresa', JSON.stringify(empresaResponse?.data?.id));

          this.submitted = false;

          this.form.reset({
            nombre_empresa: '',
            tipos: '',
            email: '',
            telefono: '',
            username: '',
            password: '',
            provincia: null,
            localidad: null,
            direccion: null,
          });

          this.form.controls.localidad.disable({ emitEvent: false });

          this.router.navigate(['proveedor-dashboard']);
        },
        error: (err) => {
          console.error('Error en el flujo completo:', err);
        },
      });
  }
}