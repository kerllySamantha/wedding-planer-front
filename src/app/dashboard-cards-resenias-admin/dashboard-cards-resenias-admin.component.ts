import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';

@Component({
  selector: 'app-dashboard-cards-resenias-admin',
  standalone: true,
   imports: [CommonModule, MatCard, MatCardContent, MatCardHeader, MatCardTitle],
  templateUrl: './dashboard-cards-resenias-admin.component.html',
  styleUrl: './dashboard-cards-resenias-admin.component.scss',
})
export class DashboardCardsReseniasAdminComponent {

  title = input<string>('');

}
