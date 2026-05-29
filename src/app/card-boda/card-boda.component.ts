import { Component, input } from '@angular/core';
import { Boda } from '../Interfaces/Boda';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { APP_PATHS } from '../app.paths';

@Component({
  selector: 'app-card-boda',
  imports: [CommonModule, RouterLink],
  templateUrl: './card-boda.component.html',
  styleUrl: './card-boda.component.scss'
})
export class CardBodaComponent {
  boda = input<Boda | null>();
  readonly APP_PATHS = APP_PATHS;

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
