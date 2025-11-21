import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';
import { noAuthGuard } from './auth/guards/no-auth.guard';
import { AuthLayoutComponent } from './auth/auth-layout.component';
import { HomePage } from './pages/home.page';

export const routes: Routes = [
  
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    canActivate: [authGuard],
    title: 'Home',
    // component: HomePage,
    path: 'home',
    loadComponent: () => import('./pages/home.page').then((m) => m.HomePage),
    
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    canActivate: [noAuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        title: 'Log in',
        path: 'login',
        loadComponent: () =>
          import('./auth/pages/login/login.page').then((m) => m.LoginPage),
      },
      {
        title: 'Sign up',
        path: 'signup',
        loadComponent: () =>
          import('./auth/pages/signup/signup.page').then((m) => m.SignUpPage),
      },
    ],
  },
  {
    title: 'Not found',
    path: '**',
    redirectTo: '/',
  },
];
