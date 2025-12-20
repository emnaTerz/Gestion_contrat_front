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
branchOptionsForDialog: { label: string; value: string }[] = [];
displayProductCodeDialog: boolean = false;
productCodeOptions: { label: string; value: string }[] = [];
selectedProductCode: string | null = null;
selectedBranch: string | null = null;
displayBranchDialog: boolean = false;

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
navigateToContrat() {
  // Ici on redirige vers la route Contrat
  this.router.navigate(['/Contrat']);
}
navigateToLanding() {
  this.router.navigate(['/Landing']); // Assure-toi que '/landing' est bien la route de ta landing page
}

allBranchOptions = [
  { label: 'MRP', value: 'M' },
  { label: 'Incendie', value: 'I' },
  { label: 'Risque Technique', value: 'Q' },
  { label: 'MRH', value: 'B' }
];

openBranchDialogForAdmin(): void {
  // Pour un admin, on affiche toutes les branches
  this.branchOptionsForDialog = this.allBranchOptions;
  this.displayBranchDialog = true;
}
goToSelectedBranch(): void {
  if (!this.selectedBranch) return;

  if (this.selectedBranch === 'Q') {
    // Branche Q → ouvrir la modale pour choisir le code produit
    this.productCodeOptions = [
      { label: 'Bris de machine', value: '260' },
      { label: 'Engins de chantiers', value: '268' }
    ];
    this.displayBranchDialog = false;       // fermer la modale branche
    this.displayProductCodeDialog = true;   // ouvrir la modale code produit
  } else {
    // Autres branches → navigation directe
    const path = `/contrat/creation/${this.selectedBranch}`;
    console.log('Redirection vers :', path); 
    this.displayBranchDialog = false;
    this.router.navigate([path]);
  }
}

// Après sélection du code produit
goToCreateContratWithProductCode(): void {
  if (this.selectedBranch && this.selectedProductCode) {
    const path = `/contrat/creation/${this.selectedProductCode}`;
    console.log('Redirection vers :', path);
    this.displayProductCodeDialog = false;
    this.router.navigate([path]);
  }
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
navigateToGaranties() {
  this.router.navigate(['/garanties']); 
}

  save() {
    if (this.tarif) {
      this.contratService.updateTarif(this.tarif.id, this.tarif).subscribe(() => {
        this.displayDialog = false;
        alert('Tarif mis à jour avec succès ✅');
      });
    }
  }

  navigateToContrats() {
    this.router.navigate(['/contrat-list']);
  }
}