import { Component, computed, input } from '@angular/core';
import { Reserva } from '../Interfaces/Reserva';
import localeEs from '@angular/common/locales/es';
import { CommonModule, DatePipe, registerLocaleData } from '@angular/common';
registerLocaleData(localeEs);

@Component({
  selector: 'app-card-info-admin',
  imports: [DatePipe, CommonModule],
  templateUrl: './card-info-admin.component.html',
  styleUrl: './card-info-admin.component.scss',
  host: {
    'class': 'dashboard-card-item card-gap d-flex'
  }
})
export class CardInfoAdminComponent {
  reservas = input<Reserva[] | null>();
  error = input<string | null>();

  today = input<Date | null>(null);

  loading = input<boolean>();

  tittle = input.required<string>();

  displayDate = computed(() => this.today() ?? new Date());

  reservasCount = computed(() => this.reservas()?.length ?? 0);

  cardVariant = computed(() => {
    const title = this.tittle().toLowerCase();

    if (title.includes('confirm')) {
      return 'card-variant-confirmadas';
    }

    if (title.includes('pendient')) {
      return 'card-variant-pendientes';
    }

    if (title.includes('cancel')) {
      return 'card-variant-canceladas';
    }

    if (title.includes('bloquead')) {
      return 'card-variant-bloqueadas';
    }

    if (title.includes('rechaz')) {
      return 'card-variant-rechazadas';
    }

    return 'card-variant-default';
  });

}
