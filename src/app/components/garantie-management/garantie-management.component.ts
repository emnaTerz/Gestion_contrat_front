 import { Branche, ContratService, Garantie } from '@/layout/service/contrat';
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
selectedExclusionBranche: Branche | null = null;

Branche = [
  { label: 'MRP', value: Branche.M },
  { label: 'RC', value: Branche.R },
  { label: 'Incendie', value: Branche.I },
  { label: 'Risque technique', value: Branche.Q },
];
  displayBrancheDialog = false;
  selectedGarantieId: number | null = null;
  selectedBranche: string | null = null;
  garanties: Garantie[] = [];
activeTab: 'garanties' | 'clausiers' | 'exclusions' = 'garanties';
  newClausierLibelle: string = '';
  clausiers: any[] = [];
displayExclusionDialog = false;
exclusionsGlobales: any[] = [];
newExclusionLibelle: string = '';

  newGarantieLibelle: string = '';
    constructor(private contratService: ContratService, private confirmationService: ConfirmationService,private messageService: MessageService, private router: Router) {}

  ngOnInit(): void {
    this.loadGaranties();
    this.loadClausiers();
  }


openExclusionDialog() {
  this.displayExclusionDialog = true;
  this.selectedExclusionBranche = null;
}
confirmExclusionBranche() {
  if (!this.selectedExclusionBranche) return;

  this.displayExclusionDialog = false;
  this.activeTab = 'exclusions';

  this.loadExclusionsGlobales();
}

  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (files.length > 0) {
      const file = files[0];
      
      if (file.type !== 'application/pdf') {
        this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez sélectionner un fichier PDF' });
        return;
      }

      if (!this.newClausierLibelle.trim()) {
        this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez saisir un nom pour le clausier' });
        return;
      }

      this.contratService.createClausierWithPdf(file, this.newClausierLibelle.trim()).subscribe({
        next: (response) => {
          this.loadClausiers();
          event.target.value = '';
          this.newClausierLibelle = '';
          this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Clausier créé avec succès !' });
        },
        error: (err) => {
          console.error('Erreur lors de la création du clausier:', err);
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la création du clausier' });
        }
      });
    }
  }

  loadClausiers() {
    this.contratService.getAllClausiers().subscribe({
      next: (data) => this.clausiers = data,
      error: (err) => {
        console.error('Erreur chargement clausiers', err);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors du chargement des clausiers' });
      }
    });
  }

  confirmDeleteClausier(id: number, nom: string) {
    this.confirmationService.confirm({
      message: `Voulez-vous vraiment supprimer le clausier "<strong>${nom}</strong>" ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.contratService.deleteClausier(id).subscribe({
          next: () => {
            this.loadClausiers();
            this.messageService.add({ severity: 'info', summary: 'Supprimé', detail: 'Clausier supprimé avec succès' });
          },
          error: (err) => {
            console.error('Erreur suppression clausier', err);
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la suppression du clausier' });
          }
        });
      }
    });
  }

downloadPdf(clausier: any) {
  if (!clausier?.file) {
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Aucun fichier PDF dans ce clausier.'
    });
    return;
  }

  try {
    // 🔹 Supprimer le header éventuel "data:application/pdf;base64,"
    const base64 = clausier.file.includes(',')
      ? clausier.file.split(',')[1]
      : clausier.file;

    // 🔹 Convertir base64 → Uint8Array
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // 🔹 Création du Blob PDF
    const blob = new Blob([byteArray], { type: 'application/pdf' });

    // 🔹 Création d'un lien de téléchargement
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Nom du fichier
    link.download = clausier.nom || 'clausier.pdf';

    // 🔹 Télécharger
    link.click();

    // 🔹 Nettoyer
    URL.revokeObjectURL(url);

    this.messageService.add({
      severity: 'success',
      summary: 'Téléchargé',
      detail: 'PDF téléchargé avec succès'
    });

  } catch (error) {
    console.error("Erreur téléchargement PDF:", error);
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de télécharger le fichier'
    });
  }
}
 loadGaranties() {
    this.contratService.getAllGaranties().subscribe(res => {
      this.garanties = res;
    });
  }

  
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
}
loadExclusionsGlobales() {
  if (!this.selectedExclusionBranche) return;

  // 🔹 Récupérer l'objet Branche correspondant à la valeur sélectionnée

  this.contratService.getExclusionsGlobalesByBranche(  this.selectedExclusionBranche as Branche
).subscribe({
    next: (data) => this.exclusionsGlobales = data,
    error: (err) => {
      console.error('Erreur chargement exclusions globales', err);
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors du chargement des exclusions globales' });
    }
  });
}

addExclusionGlobal() {
  if (!this.newExclusionLibelle.trim() || !this.selectedExclusionBranche) return;

  const payload = {
    libelle: this.newExclusionLibelle.trim(),
    branche: this.selectedExclusionBranche,
    service: null   // ✅ OBLIGATOIRE
  };

  this.contratService.addExclusionGlobale(payload).subscribe({
    next: (res) => {
      this.exclusionsGlobales.push(res);
      this.newExclusionLibelle = '';
      this.messageService.add({
        severity: 'success',
        summary: 'Ajouté',
        detail: 'Exclusion globale ajoutée'
      });
    },
    error: (err) => {
      console.error(err);
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Erreur lors de l\'ajout'
      });
    }
  });
}


deleteExclusionGlobal(id: number) {
  this.contratService.deleteExclusionGlobale(id).subscribe({
    next: () => {
      this.exclusionsGlobales = this.exclusionsGlobales.filter(e => e.id !== id);
      this.messageService.add({ severity: 'info', summary: 'Supprimé', detail: 'Exclusion globale supprimée' });
    },
    error: (err) => {
      console.error(err);
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la suppression' });
    }
  });
}

confirmDeleteExclusion(id: number) {
  this.confirmationService.confirm({
    message: 'Voulez-vous vraiment supprimer cette exclusion globale ?',
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Oui',   // texte du bouton accepter
    rejectLabel: 'Non',   // texte du bouton refuser
    accept: () => {
      this.deleteExclusionGlobal(id);
    }
  });
}

}

