import { Component, input, signal } from '@angular/core';
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
  
    today = input<Date>();
  
  loading = input<boolean>();
  
  tittle = input.required<string>()

}
