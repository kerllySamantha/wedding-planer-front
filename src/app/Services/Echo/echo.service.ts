import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { environment } from '../../Interfaces/Enviroment';
@Injectable({ providedIn: 'root' })
export class EchoService {

  private http = inject(HttpClient);
  private echo: Echo<'reverb'> | null = null;
  private csrfReady = false;

  prepare(): Promise<void> {
    if (this.csrfReady) return Promise.resolve();
    const apiBaseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    return firstValueFrom(
      this.http.get(`${apiBaseUrl}/sanctum/csrf-cookie`, { withCredentials: true })
    ).then(() => { this.csrfReady = true; });
  }




  init(): Echo<'reverb'> {
    if (this.echo) return this.echo;

    (window as any).Pusher = Pusher;

    void this.prepare();

    const apiBaseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    const token = localStorage.getItem('token');

    this.echo = new Echo<'reverb'>({
      broadcaster: 'reverb',
      key: environment.reverbKey,
      wsHost: environment.reverbHost,
      wsPort: environment.reverbPort,
      wssPort: environment.reverbPort,
      forceTLS: false,
      enabledTransports: ['ws', 'wss'],
      // Sin CSRF, solo Bearer token
       authEndpoint: `${environment.apiUrl}/broadcasting/auth`,
      withCredentials: true,
      auth: {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Accept': 'application/json',
    }
}
    });

    this.echo.connector.pusher.connection.bind('connected', () => {
  console.log('✅ Reverb conectado');
});

this.echo.connector.pusher.connection.bind('error', (err: any) => {
  console.error('❌ Reverb error:', err);
});

this.echo.connector.pusher.connection.bind('state_change', (states: any) => {
  console.log('🔄 Estado WS:', states.previous, '→', states.current);
});

    return this.echo;
  }




 
  get instance(): Echo<'reverb'> {
    return this.echo ?? this.init();
  }

  disconnect() {
    this.echo?.disconnect();
    this.echo = null;
  }
}
