import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Foto } from '../Interfaces/Resenia';

interface GaleriaDialogData {
  fotos: Foto[];
  indiceInicial?: number;
  nombreEmpresa?: string;
}

@Component({
  selector: 'app-modal-galeria-fotos',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './modal-galeria-fotos.component.html',
  styleUrl: './modal-galeria-fotos.component.scss',
})
export class ModalGaleriaFotosComponent {
  private readonly dialogRef = inject(MatDialogRef<ModalGaleriaFotosComponent>);
  readonly data = inject<GaleriaDialogData>(MAT_DIALOG_DATA);

  indiceActual = signal(this.data.indiceInicial ?? 0);
  fotoActual = computed(() => this.data.fotos[this.indiceActual()]);
  totalFotos = computed(() => this.data.fotos.length);

  siguiente(): void {
    this.indiceActual.update(i => (i + 1) % this.totalFotos());
  }

  anterior(): void {
    this.indiceActual.update(i => (i - 1 + this.totalFotos()) % this.totalFotos());
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') this.siguiente();
    if (event.key === 'ArrowLeft') this.anterior();
  }
}
