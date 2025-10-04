import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Branche, ContratService, Tarif } from '@/layout/service/contrat';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, ButtonModule, FormsModule, DialogModule ],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent {
  isAdmin: boolean = false;
  showTopbar: boolean = true;
  displayDialog: boolean = false; 
  branches = Object.values(Branche); // ['M','R','I']
  selectedBranche: Branche | null = null;
 tarif: any;
  constructor(private router: Router, private messageService: MessageService, private contratService: ContratService) {}

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
    navigateToUsers() {
    this.router.navigate(['/users']);
  }
  navigateToTarif() {
  this.router.navigate(['/tarif']); 
}



openDialog() {
  this.displayDialog = true;
}

onBrancheChange() {
    if (this.selectedBranche) {
      this.contratService.getTarifByBranche(this.selectedBranche).subscribe(res => {
        this.tarif = res;
      });
    }
  }

  save() {
    if (this.tarif) {
      this.contratService.updateTarif(this.tarif.id, this.tarif).subscribe(() => {
        this.displayDialog = false;
        alert('Tarif mis à jour avec succès ✅');
      });
    }
  }}