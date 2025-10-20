import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './Interceptors/auth.interceptor';
import { UsuariosServiceService } from './Services/Users/usuarios-service.service';
import { UsuariosApiServiceService } from './Services/Users/usuarios-api-service.service';
import { EmpresasServiceServiceService } from './Services/Empresas/empresas-service-service.service';
import { EmpresasApiServiceService } from './Services/Empresas/empresas-api-service.service';
import { PerfilServiceServiceService } from './Services/Perfiles/perfil-service-service.service';
import { PerfilApiServiceService } from './Services/Perfiles/perfil-api-service.service';
import { API_URL } from './Tokens/serviceTokens';
import { ReseniasServiceServiceService } from './Services/Resenias/resenias-service-service.service';
import { ReseniasApiServiceService } from './Services/Resenias/resenias-api-service.service';
import { BodaServiceServiceService } from './Services/Bodas/boda-service-service.service';
import { BodaApiServiceService } from './Services/Bodas/boda-api-service.service';
import { CategoriasServiceService } from './Services/Catergorias/categoria-service.service';
import { CategoriasApiServiceService } from './Services/Catergorias/categoria-api-service.service';
import { AuthenticationService } from './Services/Autentication/authenticationService';
import { AutenticarHttpClientService } from './Services/Autentication/autenticar-http-client.service';
import { provideAnimations } from '@angular/platform-browser/animations';
import { RegionsServer } from './Services/Regiones/regiones-abstract.server';
import { RegionesApiServer } from './Services/Regiones/regiones-api.server';
const url_back = 'http://localhost:8000/api';
export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes),
  //  provideHttpClient(withInterceptors([authInterceptor])),
  provideHttpClient(),
  provideAnimations(),
  provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes),
  { provide: UsuariosServiceService, useExisting: UsuariosApiServiceService },
  { provide: EmpresasServiceServiceService, useExisting: EmpresasApiServiceService },
  { provide: ReseniasServiceServiceService, useExisting: ReseniasApiServiceService },
  { provide: BodaServiceServiceService, useExisting: BodaApiServiceService },
  { provide: PerfilServiceServiceService, useExisting: PerfilApiServiceService },
  { provide: CategoriasServiceService, useExisting: CategoriasApiServiceService },
  { provide: AuthenticationService, useExisting: AutenticarHttpClientService },
  { provide: API_URL, useValue: url_back },
  { provide: RegionsServer, useExisting: RegionesApiServer }


  ]
};
