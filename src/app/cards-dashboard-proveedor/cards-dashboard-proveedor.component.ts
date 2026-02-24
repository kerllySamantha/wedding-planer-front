import { Component, computed, ElementRef, AfterContentInit, inject, signal, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ReservasServiceServiceService } from '../Services/Reservas/reservas-service-service.service';
import { Reserva } from '../Interfaces/Reserva';
import { DatePipe, registerLocaleData, TitleCasePipe } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { register } from 'swiper/element/bundle';

register();

import {
  isSameMonth,
  parseISO,
  eachMonthOfInterval,
  startOfYear,
  endOfYear
} from 'date-fns';

import { Navigation, Thumbs, FreeMode, Scrollbar, } from 'swiper/modules';
import { cilChevronLeft, cilChevronRight, cilListNumbered, cilPaperPlane } from '@coreui/icons';


import { IconDirective, IconModule, IconSetService } from '@coreui/icons-angular';
import SwiperCore from 'swiper';


import { CardInfoAdminComponent } from "../card-info-admin/card-info-admin.component";


registerLocaleData(localeEs);
SwiperCore.use([Navigation, Thumbs, FreeMode]);

@Component({
  selector: 'app-cards-dashboard-proveedor',
  standalone: true,
  imports: [CardInfoAdminComponent, DatePipe, TitleCasePipe, IconModule, IconDirective],
  providers: [IconSetService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './cards-dashboard-proveedor.component.html',
  styleUrl: './cards-dashboard-proveedor.component.scss',
})
export class CardsDashboardProveedorComponent {

  reservasctx = inject(ReservasServiceServiceService);

  @ViewChild('swiperRef') swiperRef!: ElementRef;

  activeIndex = computed(() => this.selectedDate().getMonth());

  private iconSet = inject(IconSetService);
  constructor() {
    this.iconSet.icons = {
      cilListNumbered,
      cilPaperPlane,
      cilChevronRight,
      cilChevronLeft
    };
  }

  // 🔹 Signals base
  reservas = signal<Reserva[]>([]);
  selectedDate = signal<Date>(new Date());
  error = signal<string | null>(null);
  loading = signal(true);

  // 🔹 Año actual
  year = new Date().getFullYear();

  // 🔹 Meses dinámicos del año
  meses = eachMonthOfInterval({
    start: startOfYear(new Date(this.year, 0, 1)),
    end: endOfYear(new Date(this.year, 11, 31))
  });

  idEmpresa = computed(() => localStorage.getItem('idEmpresa')!);

  // 🔹 Reservas filtradas por mes seleccionado
  reservasMes = computed(() =>
    this.reservas().filter(r =>
      isSameMonth(
        parseISO(r.fecha_inicio),
        this.selectedDate()
      )
    )
  );




  prevMonth() {
    const current = this.selectedDate();
    const newMonth = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    this.selectedDate.set(newMonth);
  }

  nextMonth() {
    const current = this.selectedDate();
    const newMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    this.selectedDate.set(newMonth);
  }

  reservasMesPorFecha(date: Date) {
    return this.reservas().filter(r =>
      isSameMonth(parseISO(r.fecha_inicio), date)
    );
  }


  reservasPendientes = computed(() =>
    this.reservasMes().filter(r => r.estado === 'pendiente')
  );

  reservasCanceladas = computed(() =>
    this.reservasMes().filter(r => r.estado === 'cancelada')
  );

  reservasCompletadas = computed(() =>
    this.reservasMes().filter(r => r.estado === 'confirmada')
  );

  reservasBloqueadas = computed(() =>
    this.reservasMes().filter(r => r.estado === 'bloqueada')
  );

  reservasRechazadas = computed(() =>
    this.reservasMes().filter(r => r.estado === 'rechazada')
  );

  ngOnInit() {
    this.cargarReservas();
  }

  cambiarMes(date: Date) {
    this.selectedDate.set(date);
  }

  cargarReservas(): void {
    this.loading.set(true);
    this.error.set(null);

    this.reservasctx.getReservaEmpresa(this.idEmpresa())
      .subscribe({
        next: (resp) => {
          this.reservas.set(resp?.data ?? []);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar las reservas');
          this.loading.set(false);
        }
      });
  }
}