import { Injectable } from '@angular/core';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

@Injectable({
  providedIn: 'root'
})
export class ReverbServiceTsService {


  echo: any;

  constructor() {
    // @ts-ignore
    window.Pusher = Pusher;

    this.echo = new Echo({
      broadcaster: 'reverb',
      key: 'ejduzccgbzpw2dyg9pmf', 
      wsHost: 'localhost',
      wsPort: 8080,
      wssPort: 8080,
      forceTLS: false,
      encrypted: false,
      disableStats: true,
      enabledTransports: ['ws'],
      cluster: 'mt1',
    });
  }

  listen(channel: string, event: string, callback: (data: any) => void) {
    this.echo.channel(channel).listen(event, callback);
  }
}
