import { Component, computed, input } from '@angular/core';
import { Empresa } from '../Interfaces/Empresa';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-card-miboda-empresa',
  imports: [MatCardModule, MatButtonModule, RouterLink],
  templateUrl: './card-miboda-empresa.component.html',
  styleUrl: './card-miboda-empresa.component.scss'
})
export class CardMibodaEmpresaComponent {
  empresa = input<Empresa | null>();

  badgeTexto = computed(() => {
    const tipo = this.empresa()?.tipo_servicio?.trim();
    return tipo && tipo.length ? tipo : 'Servicio';
  });

  iniciales = computed(() => {
    const nombre = this.empresa()?.nombre_empresa?.trim() || '';
    if (!nombre) return '—';
    const partes = nombre.split(/\s+/).filter(Boolean);
    if (partes.length === 1) return partes[0].slice(0, 1).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  });

  iconoServicio = computed(() => {
    const tipo = (this.empresa()?.tipo_servicio || '').toLowerCase();
    if (tipo.includes('carpa')) return 'bi-house-heart';
    if (tipo.includes('catering') || tipo.includes('comida')) return 'bi-cup-hot';
    if (tipo.includes('foto') || tipo.includes('video')) return 'bi-camera';
    if (tipo.includes('joy')) return 'bi-gem';
    if (tipo.includes('mus')) return 'bi-music-note-beamed';
    return 'bi-stars';
  });
}
