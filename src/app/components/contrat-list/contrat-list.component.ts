
import { Contrat, ContratService } from '@/layout/service/contrat';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleButtonModule } from 'primeng/togglebutton';

import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-contrat-list',
  standalone: true,
    imports: [CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    TagModule,
    ToastModule,
  DialogModule,
  ToggleButtonModule ],

  templateUrl: './contrat-list.component.html',
  styleUrls: ['./contrat-list.component.scss']
})
export class ContratListComponent implements OnInit {

  contrats: Contrat[] = [];
  filteredContrats: Contrat[] = [];
  loading: boolean = false;
  isDownloading: boolean = false;
  downloadErrorMessage: string = '';
  displayDownloadDialog: boolean = false;
displayAdherentDialog: boolean = false;
selectedAdherent: any = null;

showAdherentDetails(adherent: any) {
  this.selectedAdherent = adherent;
  this.displayAdherentDialog = true;
}

  constructor(
    private contratService: ContratService,
    private router: Router,
    private messageService: MessageService
  ) {}
   isAdmin: boolean = false;
dateDebutFilter: string | null = null;
dateFinFilter: string | null = null;
getFractionnementLabel(value: number | string | null): string {
  switch (value) {
    case 0:
    case 'ZERO':
      return 'Annuel';
    case 1:
    case 'UN':
      return 'Semestriel';
    case 2:
    case 'DEUX':
      return 'Trimestriel';
    default:
      return 'N/A';
  }
}

filterByDate() {
  this.filteredContrats = this.contrats.filter(c => {
    const debut = c.dateDebut ? new Date(c.dateDebut) : null;
    const fin = c.dateFin ? new Date(c.dateFin) : null;

    const startFilter = this.dateDebutFilter ? new Date(this.dateDebutFilter) : null;
    const endFilter = this.dateFinFilter ? new Date(this.dateFinFilter) : null;

    if (startFilter && endFilter) {
      return debut && fin && debut >= startFilter && fin <= endFilter;
    } else if (startFilter) {
      return debut && debut >= startFilter;
    } else if (endFilter) {
      return fin && fin <= endFilter;
    }
    return true; // pas de filtre
  });
}
  ngOnInit(): void {
    this.getAllContrats();
     const role = localStorage.getItem('userRole');
    this.isAdmin = role === 'ADMIN';
  }



  toggleStatus(contrat: any) {
  this.contratService.toggleContratStatus(contrat.numPolice).subscribe({
    next: (res) => {
      contrat.status = res.status; // met à jour l'objet local
      this.messageService.add({
        severity: 'success',
        summary: 'Statut modifié',
        detail: `Le contrat ${contrat.numPolice} est maintenant ${contrat.status}`
      });
    },
    error: (err) => {
      console.error(err);
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Impossible de modifier le statut'
      });
    }
  });
}



 getAllContrats() {
  this.loading = true;
  this.contratService.getAllContrat().subscribe({
    next: (data) => {
      // Convertir status en booléen pour le toggle
      this.contrats = data.map(c => ({
        ...c,
        fige: c.status === 'figé'  // ✅ true si figé, false sinon
      }));
      this.filteredContrats = [...this.contrats];
      this.loading = false;
    },
    error: (err) => {
      console.error(err);
      this.loading = false;
    }
  });
}


onGlobalFilter(event: any) {
  const value = event.target.value.toLowerCase();

  this.filteredContrats = this.contrats.filter(c => {
    const fractionnementLabel = this.getFractionnementLabel(c.fractionnement).toLowerCase();

    return (
      c.numPolice?.toLowerCase().includes(value) ||
      c.adherent?.codeId?.toLowerCase().includes(value) ||
      fractionnementLabel.includes(value) || // ✅ on filtre sur le libellé lisible
      c.codeRenouvellement?.toLowerCase().includes(value) ||
      c.branche?.toLowerCase().includes(value) ||
      c.typeContrat?.toLowerCase().includes(value) ||
      c.codeAgence?.toLowerCase().includes(value) ||
      c.primeTTC?.toString().includes(value)
    );
  });
}

  clearFilter() {
    this.filteredContrats = this.contrats;
  }

  // Redirection vers la page de modification
  editContrat(contrat: Contrat) {
    this.router.navigate(['Modif_Contrat', contrat.numPolice]);
  }

  // Télécharger le contrat en PDF
  downloadPdf(numPolice: string) {
    this.isDownloading = true;
    this.contratService.downloadContratPdf(numPolice).subscribe({
      next: (blob: Blob) => {
        this.isDownloading = false;
        this.downloadAndSavePdf(blob, numPolice);
        this.displayDownloadDialog = false;

        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Contrat téléchargé avec succès'
        });
      },
      error: (error) => {
        this.isDownloading = false;
        console.error('Erreur téléchargement PDF:', error);
        this.downloadErrorMessage = 'Erreur lors du téléchargement';
      }
    });
  }

  // Fonction utilitaire pour sauvegarder le PDF
  private downloadAndSavePdf(blob: Blob, numPolice: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Contrat_${numPolice}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
