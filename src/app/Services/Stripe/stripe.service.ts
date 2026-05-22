import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../Tokens/serviceTokens';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { firstValueFrom } from 'rxjs';


const STRIPE_PUBLIC_KEY = 'pk_test_51TZDDsV05BxU9Bx9JjPdSSL0Q3bb2usV9Wk4F8FvtUfNNmLjCqvjKJGXYTHtL6YDmZgjW0EbY495mpqOsTjlM5Vo00LguMI6wX';

@Injectable({ providedIn: 'root' })
export class StripeService {
  private http = inject(HttpClient);
  private apiUrl = inject(API_URL);

  private stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

  getStripe(): Promise<Stripe | null> {
    return this.stripePromise;
  }

  async createPaymentIntent(reservaId: number | string): Promise<string> {
    const res = await firstValueFrom(
      this.http.post<{ client_secret: string }>(
        `${this.apiUrl}/stripe/create-payment-intent`,
        { reserva_id: reservaId }
      )
    );
    return res.client_secret;
  }
}
