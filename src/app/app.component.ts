import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AutenticarHttpClientService } from './Services/Autentication/autenticar-http-client.service';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'wedding-planer-front';


  constructor(private auth: AutenticarHttpClientService, private router: Router) {
    this.auth.restoreSession();
    window.addEventListener('pageshow', event => {
      if (event.persisted) {
        window.location.reload();
      }
    });
  }




}
