import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent {
  isAdmin: boolean = false;
  showTopbar: boolean = true;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.updateRoleAndVisibility();

    // Mise à jour à chaque navigation
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateRoleAndVisibility();
      }
    });
  }

  updateRoleAndVisibility() {
    const role = localStorage.getItem('userRole');
    this.isAdmin = role === 'ADMIN';

    // Masquer topbar sur login
    this.showTopbar = this.router.url !== '/login';
  }

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  navigateToHistory() {
    this.router.navigate(['/action-history']);
  }
    logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    this.router.navigate(['/login']); // redirection vers login
  }
}