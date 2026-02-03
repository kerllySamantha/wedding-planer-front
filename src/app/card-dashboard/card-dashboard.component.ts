import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { Resenia } from '../Interfaces/Resenia';

@Component({
  selector: 'app-card-dashboard',
  imports: [],
  templateUrl: './card-dashboard.component.html',
  styleUrl: './card-dashboard.component.scss'
})
export class CardDashboardComponent {

  resenia = input<Resenia | null>();

}
