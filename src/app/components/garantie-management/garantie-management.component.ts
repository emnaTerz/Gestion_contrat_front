import { ContratService, Garantie } from '@/layout/service/contrat';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';


@Component({
  selector: 'app-garantie-management',
  standalone: true,
  imports: [CommonModule, 
    FormsModule, 
    ButtonModule,
    InputTextModule,
    CardModule, ConfirmDialogModule,
    ToastModule,
    ButtonModule],
  templateUrl: './garantie-management.component.html',
  styleUrl: './garantie-management.component.scss',
   providers: [ConfirmationService, MessageService]
})

export class GarantieManagementComponent implements OnInit {
  Branche = [
  { label: 'M', value: 'M' },
  { label: 'R', value: 'R' },
  { label: 'I', value: 'I' },
];
displayBrancheDialog = false;
selectedGarantieId: number | null = null;
selectedBranche: string | null = null;
    garanties: Garantie[] = [];

    constructor(private contratService: ContratService, private confirmationService: ConfirmationService,private messageService: MessageService, private router: Router) {}

ngOnInit(): void {
    this.loadGaranties();
  }

  loadGaranties() {
    this.contratService.getAllGaranties().subscribe(res => {
      this.garanties = res;
      console.log('Garanties:', this.garanties);
    });

}

newGarantieLibelle: string = '';

 addGarantie() {
  if (!this.newGarantieLibelle.trim()) {
    alert('Veuillez saisir le nom de la garantie');
    return;
  }

  // Crée le payload avec le bon champ attendu par le backend
  const payload = { libelle: this.newGarantieLibelle.trim() };

  this.contratService.createGarantie(payload as any).subscribe({
    next: (res: any) => {
      // On mappe le champ libelle pour l'affichage
      const nouvelleGarantie: Garantie = {
        id: res.id,
        libelle: res.libelle,  // res.libelle devrait maintenant contenir la valeur
      };

      this.garanties.push(nouvelleGarantie);
      this.newGarantieLibelle = ''; // reset input
    },
    error: (err) => {
      console.error(err);
      alert('Erreur lors de la création de la garantie');
    }
  });
}

 confirmDelete(id: number, libelle: string) {
    this.confirmationService.confirm({
      message: `Voulez-vous vraiment supprimer la garantie "<strong>${libelle}</strong>" ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.deleteGarantie(id);
      }
    });
  }

  deleteGarantie(id: number) {
    this.contratService.deleteGarantie(id).subscribe(() => {
      this.loadGaranties();
      this.messageService.add({ severity: 'info', summary: 'Supprimée', detail: 'Garantie supprimée avec succès' });
    });
  }
  openBrancheDialog(garantieId: number) {
  this.selectedGarantieId = garantieId;
  this.displayBrancheDialog = true;
}

onBrancheSelected() {
  if (this.selectedGarantieId && this.selectedBranche) {
    this.displayBrancheDialog = false;
    // naviguer vers l'interface des sous‑garanties
    this.router.navigate(['/sous-garanties'], {
      queryParams: {
        garantieId: this.selectedGarantieId,
        branche: this.selectedBranche
      }
    });
  }
}}
