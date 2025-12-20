

import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRole = route.data['expectedRole'];
    const tokenExists = this.authService.isLoggedIn();
    const userRole = this.authService.getRole();

    if (!tokenExists) {
      this.router.navigate(['/login']);
      return false;
    }

    // ✅ Vérifie si le rôle est inclus dans la liste autorisée
    if (expectedRole && !expectedRole.includes(userRole)) {
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}
