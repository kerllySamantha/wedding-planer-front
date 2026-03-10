import { Component } from '@angular/core';
import { AdminSolicitudesPanelComponent } from '../admin-solicitudes-panel/admin-solicitudes-panel.component';

@Component({
  selector: 'app-admin-solicitudes-dashboard',
  imports: [AdminSolicitudesPanelComponent],
  templateUrl: './admin-solicitudes-dashboard.component.html',
  styleUrl: './admin-solicitudes-dashboard.component.scss',
})
export class AdminSolicitudesDashboardComponent {}
