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
  private reconnectTimer: number | null = null;
  private userNotificationHandlers = new Map<string, Set<(data: any) => void>>();

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

    this.echo = new Echo<'reverb'>({
      broadcaster: 'reverb',
      key: environment.reverbKey,
      wsHost: environment.reverbHost,
      wsPort: environment.reverbPort,
      wssPort: environment.reverbPort,
      forceTLS: false,
      enabledTransports: ['ws', 'wss'],
      authEndpoint: `${environment.apiUrl}/broadcasting/auth`,
      auth: {
        headers: {
          // getter dinamico: lee el token en cada peticion
          get Authorization() {
            return `Bearer ${localStorage.getItem('token')}`;
          },
          'Accept': 'application/json',
        }
      }
    });

    const connection = this.echo.connector.pusher.connection;

    connection.bind('connected', () => {
      console.log('Reverb conectado');
    });

    connection.bind('error', (err: any) => {
      console.error('Reverb error:', err);
      this.scheduleReconnect();
    });

    connection.bind('disconnected', () => {
      this.scheduleReconnect();
    });

    connection.bind('state_change', (states: any) => {
      console.log('Estado WS:', states.previous, '->', states.current);
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

  subscribeUserNotifications(userId: number | string, handler: (data: any) => void): () => void {
    const channel = `usuario.${userId}`;
    let handlers = this.userNotificationHandlers.get(channel);
    const isFirst = !handlers;
    if (!handlers) {
      handlers = new Set<(data: any) => void>();
      this.userNotificationHandlers.set(channel, handlers);
    }
    handlers.add(handler);

    if (isFirst) {
      this.instance
        .private(channel)
        .listen('.nueva-notificacion', (data: any) => {
          const current = this.userNotificationHandlers.get(channel);
          if (!current || current.size === 0) return;
          current.forEach(cb => cb(data));
        });
    }

    return () => {
      const current = this.userNotificationHandlers.get(channel);
      if (!current) return;
      current.delete(handler);
      if (current.size === 0) {
        this.userNotificationHandlers.delete(channel);
        this.instance.leave(channel);
      }
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer != null) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      try {
        this.echo?.connector?.pusher?.connect();
      } catch (err) {
        console.error('Error al reconectar Reverb:', err);
      }
    }, 3000);
  }
}
