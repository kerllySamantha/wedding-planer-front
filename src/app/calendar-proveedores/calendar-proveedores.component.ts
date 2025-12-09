import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-calendar-proveedores',
  imports: [CommonModule; ],
  templateUrl: './calendar-proveedores.component.html',
  styleUrl: './calendar-proveedores.component.scss'
})
export class CalendarProveedoresComponent {

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin]
  };
}
