import { HttpClient } from "@angular/common/http";
import { computed, Injectable, signal } from "@angular/core";
import { map, Observable, tap } from "rxjs";
import { User, UserResponse } from "../../Interfaces/User";


@Injectable({
  providedIn: 'root'
})
export abstract class AuthenticationService {

  auth = signal<undefined | User>(undefined);
  readonly fotoUrl = signal<string | null>(null);

  username = computed(() => this.auth()?.name);
  rol = computed(() => this.auth()?.rol);

  constructor() {
    this.restoreSession();
  }

  usuario_id = computed(() => {
    const id = this.auth()?.id;
    if (id) return id;
    const local = localStorage.getItem('id');
    return local ? Number(local) : undefined;
  });

  abstract login(email: string | null, password: string | null): Observable<UserResponse>
  abstract logout(): Observable<void>

  restoreSession() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.auth.set(user);
        this.fotoUrl.set(user.fotoPerfil || user.foto_perfil || null);
      } catch {
        localStorage.removeItem('user');
      }
    }
  }

  updateAuthUser(patch: Partial<User> & { fotoPerfil?: string }): void {
    this.auth.update(u => u ? { ...u, ...patch } : u);
    if (patch.fotoPerfil) this.fotoUrl.set(patch.fotoPerfil);
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        localStorage.setItem('user', JSON.stringify({ ...JSON.parse(stored), ...patch }));
      }
    } catch (e) {
      console.error('Error al actualizar user en localStorage:', e);
    }
  }

}
