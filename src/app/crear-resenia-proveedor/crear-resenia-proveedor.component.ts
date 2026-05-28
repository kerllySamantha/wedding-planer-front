import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { Empresa } from '../Interfaces/Empresa';
import { UploadImageResponse } from '../Interfaces/Foto';
import { CreateResenia, Foto } from '../Interfaces/Resenia';
import { NavbarComponent } from '../navbar/navbar.component';
import { AuthenticationService } from '../Services/Autentication/authenticationService';
import { EmpresasApiServiceService } from '../Services/Empresas/empresas-api-service.service';
import { ReseniasServiceServiceService } from '../Services/Resenias/resenias-service-service.service';

type CrearReseniaForm = {
  puntuacion: FormControl<string>;
  comentario: FormControl<string>;
};

type FotoSeleccionada = {
  file: File;
  previewUrl: string;
  extension: string;
};

@Component({
  selector: 'app-crear-resenia-proveedor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './crear-resenia-proveedor.component.html',
  styleUrl: './crear-resenia-proveedor.component.scss',
})
export class CrearReseniaProveedorComponent implements OnDestroy {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authCtx = inject(AuthenticationService);
  private readonly empresasApi = inject(EmpresasApiServiceService);
  private readonly reseniasService = inject(ReseniasServiceServiceService);

  readonly submitted = signal(false);
  readonly uploading = signal(false);
  readonly generalError = signal<string | null>(null);
  readonly fotosError = signal<string | null>(null);
  readonly fotosSeleccionadas = signal<FotoSeleccionada[]>([]);
  readonly hoveredStar = signal(0);

  readonly empresaRoute = toSignal(
    this.route.data.pipe(
      map((data) => {
        const proveedor = data['proveedor'] as Empresa | { data?: Empresa } | null | undefined;
        return (proveedor as { data?: Empresa } | null)?.data ?? (proveedor as Empresa | null) ?? null;
      }),
    ),
    { initialValue: null },
  );

  readonly empresa = computed(() => this.empresaRoute());
  readonly usuarioAutorizado = computed(
    () => this.authCtx.auth() && this.authCtx.rol() === 'usuario',
  );

  readonly form = new FormGroup<CrearReseniaForm>({
    puntuacion: this.fb.control('', [Validators.required]),
    comentario: this.fb.control('', [
      Validators.required,
      Validators.minLength(20),
      Validators.maxLength(700),
    ]),
  });

  isInvalid<K extends keyof CrearReseniaForm>(field: K): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched || this.submitted());
  }

  getError(field: keyof CrearReseniaForm): string {
    const control = this.form.controls[field];
    if (!control.errors) return '';

    const messages: Record<string, Record<string, string>> = {
      puntuacion: {
        required: 'Selecciona una puntuacion entre 1 y 5.',
      },
      comentario: {
        required: 'El comentario es obligatorio.',
        minlength: 'Escribe al menos 20 caracteres para que la reseña sea útil.',
        maxlength: 'No superes los 700 caracteres.',
      },
    };

    const key = Object.keys(control.errors)[0];
    return messages[field]?.[key] ?? 'Campo invalido.';
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;

    this.fotosError.set(null);

    const actuales = this.fotosSeleccionadas();
    if (actuales.length + files.length > 6) {
      this.fotosError.set('Puedes subir un maximo de 6 fotos por reseña.');
      input.value = '';
      return;
    }

    const nuevas: FotoSeleccionada[] = [];

    for (const file of files) {
      const extension = this.getImageExtension(file);
      if (!extension) {
        this.fotosError.set('Solo se permiten imagenes JPG, PNG, WEBP o GIF.');
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.fotosError.set('Cada imagen debe pesar menos de 5 MB.');
        continue;
      }

      nuevas.push({
        file,
        extension,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (nuevas.length) {
      this.fotosSeleccionadas.set([...actuales, ...nuevas]);
    }

    input.value = '';
  }

  starDescripcion(val: number): string {
    const labels: Record<number, string> = { 1: 'Malo', 2: 'Regular', 3: 'Bien', 4: 'Muy bien', 5: 'Excelente' };
    return labels[val] ?? '';
  }

  setPuntuacion(star: number): void {
    this.form.controls.puntuacion.setValue(String(star));
    this.form.controls.puntuacion.markAsTouched();
  }

  eliminarFoto(index: number): void {
    const actuales = [...this.fotosSeleccionadas()];
    const [eliminada] = actuales.splice(index, 1);
    if (eliminada?.previewUrl) {
      URL.revokeObjectURL(eliminada.previewUrl);
    }
    this.fotosSeleccionadas.set(actuales);
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);
    this.generalError.set(null);
    this.fotosError.set(null);

    if (!this.usuarioAutorizado()) {
      this.router.navigate(['/login'], {
        queryParams: {
          redirect: `/proveedores/detalles/${this.route.snapshot.params['id']}/resenas/nueva`,
        },
      });
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const empresa = this.empresa();
    const userId = Number(localStorage.getItem('id'));

    if (!empresa?.id || !userId) {
      this.generalError.set('No se pudo preparar la reseña.');
      return;
    }

    this.uploading.set(true);

    try {
      const fotos = await this.subirFotos(userId);
      const payload: CreateResenia = {
        user_id: String(userId),
        empresa_id: String(empresa.id),
        puntuacion: this.form.controls.puntuacion.value,
        comentario: this.form.controls.comentario.value.trim(),
        fotos,
      };

      await firstValueFrom(this.reseniasService.postResenia(payload));

      this.router.navigate(['/proveedores/detalles', empresa.id], {
        queryParams: { review: 'created' },
      });
    } catch (error) {
      console.error(error);
      this.generalError.set('No se pudo publicar la reseña. Revisa las fotos e inténtalo de nuevo.');
      this.uploading.set(false);
      return;
    }

    this.uploading.set(false);
  }

  volverAFicha(): void {
    const empresaId = this.route.snapshot.params['id'];
    this.router.navigate(['/proveedores/detalles', empresaId]);
  }

  ngOnDestroy(): void {
    this.fotosSeleccionadas().forEach((foto) => URL.revokeObjectURL(foto.previewUrl));
  }

  private async subirFotos(userId: number): Promise<Foto[]> {
    const fotos = this.fotosSeleccionadas();
    if (!fotos.length) return [];

    const uploads = fotos.map(async (foto) => {
      const base64 = await this.toBase64(foto.file);
      const response = await firstValueFrom(
        this.empresasApi.uploadImageBase64(base64, foto.extension, userId),
      );
      return this.toFoto(response);
    });

    return Promise.all(uploads);
  }

  private toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
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

  private toFoto(response: UploadImageResponse): Foto {
    const path = response?.path ?? '';
    const rawUrl = response?.url ?? '';
    const url = rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('/')
      ? rawUrl
      : `/${rawUrl}`;

    return { path, url };
  }
}
