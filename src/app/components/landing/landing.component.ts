import { ContratService } from '@/layout/service/contrat';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CardModule, ButtonModule, DialogModule, InputTextModule, FormsModule, CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  displayModifyDialog: boolean = false;
  numPoliceInput: string = '';
  errorMessage: string = '';
  displayDownloadDialog: boolean = false;
  downloadNumPoliceInput: string = '';
  downloadErrorMessage: string = '';
  isDownloading: boolean = false;


  constructor(private router: Router, private contratService: ContratService,private messageService: MessageService,) {}

  showModifyDialog() {
    this.numPoliceInput = '';
    this.errorMessage = '';
    this.displayModifyDialog = true;
  }

  onSubmitNumPolice() {
    if (!this.numPoliceInput || this.numPoliceInput.trim() === '') {
      this.errorMessage = 'Veuillez entrer le numéro de police';
      return;
    }

    this.contratService.checkContratExists(this.numPoliceInput.trim()).subscribe(
      exists => {
        if (exists) {
          this.displayModifyDialog = false;
          this.router.navigate([`/Modif_Contrat/${this.numPoliceInput.trim()}`]);
        } else {
          this.errorMessage = "Aucun contrat trouvé avec ce numéro";
        }
      },
      err => {
        this.errorMessage = "Erreur lors de la vérification du contrat";
        console.error(err);
      }
    );
  }
 goToCreateContrat() {
    this.router.navigate(['/Contrat']);
  }
 // NOUVELLE méthode pour le téléchargement PDF
   showDownloadDialog() {
    console.log('showDownloadDialog() appelée - ouverture du dialogue'); // Debug
    this.displayDownloadDialog = true;
    this.downloadNumPoliceInput = '';
    this.downloadErrorMessage = '';
    this.isDownloading = false;
  }

  onDownloadContrat() {
    console.log('onDownloadContrat() appelée'); // Debug
    
    if (!this.downloadNumPoliceInput || this.downloadNumPoliceInput.trim() === '') {
      this.downloadErrorMessage = 'Veuillez entrer le numéro de police';
      return;
    }

    const numPolice = this.downloadNumPoliceInput.trim();
    this.isDownloading = true;
    this.downloadErrorMessage = '';

    this.contratService.checkContratExists(numPolice).subscribe({
      next: (exists) => {
        if (exists) {
          this.downloadPdf(numPolice);
        } else {
          this.isDownloading = false;
          this.downloadErrorMessage = "Aucun contrat trouvé avec ce numéro de police";
        }
      },
      error: (err) => {
        this.isDownloading = false;
        this.downloadErrorMessage = "Erreur lors de la vérification du contrat";
        console.error(err);
      }
    });
  }

  private downloadPdf(numPolice: string) {
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

  private downloadAndSavePdf(blob: Blob, numPolice: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contrat_${numPolice}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}

