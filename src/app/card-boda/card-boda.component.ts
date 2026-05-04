import { Component, input } from '@angular/core';
import { Boda } from '../Interfaces/Boda';

@Component({
  selector: 'app-card-boda',
  imports: [],
  templateUrl: './card-boda.component.html',
  styleUrl: './card-boda.component.scss'
})
export class CardBodaComponent {
  boda = input<Boda | null>();

  resolveFotoUrl(url?: string | null, path?: string | null): string {
    const candidate = (url ?? '').trim() || (path ?? '').trim();
    if (!candidate) return 'assets/images/fondo3.jpg';
    if (candidate.startsWith('http://') || candidate.startsWith('https://') || candidate.startsWith('data:')) {
      return candidate;
    }
    if (candidate.startsWith('/')) {
      return candidate;
    }
    return `/${candidate}`;
  }

}
