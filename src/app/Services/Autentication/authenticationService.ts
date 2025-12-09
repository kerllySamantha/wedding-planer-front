import { HttpClient } from "@angular/common/http";
import { computed, Injectable, signal } from "@angular/core";
import { map, Observable, tap } from "rxjs";
import { User, UserResponse } from "../../Interfaces/User";


@Injectable({
  providedIn: 'root'
})
export abstract class AuthenticationService {

  auth = signal<undefined | User>(undefined);

  username = computed(() => this.auth()?.name);

  rol = computed(() => this.auth()?.rol);



  constructor() {
    this.restoreSession();
  }


  // token = computed(() => this.auth()?.token);
  usuario_id = computed(() => {
    const id = this.auth()?.id;
    if (id) return id;
    const local = localStorage.getItem('id');
    return local ? Number(local) : undefined;
  });

  // abstract login(email: string, password: string): Observable<Omit<User, 'token'>>


  abstract login(email: string | null, password: string | null): Observable<UserResponse>


  abstract logout(): Observable<void>
  

  restoreSession() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        this.auth.set(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
      }
    
    }
  }

}
