import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AutenticarHttpClientService } from './Services/Autentication/autenticar-http-client.service';
import { EchoService } from './Services/Echo/echo.service';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet,],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'wedding-planer-front';

    private echoSvc = inject(EchoService);
   constructor(private auth: AutenticarHttpClientService, private router: Router) {
    this.auth.restoreSession();

    const userId = localStorage.getItem('id');
    if (userId) {
      this.echoSvc.init();
    }

    window.addEventListener('pageshow', event => {
      if (event.persisted) {
        window.location.reload();
      }
    });
  }



}
