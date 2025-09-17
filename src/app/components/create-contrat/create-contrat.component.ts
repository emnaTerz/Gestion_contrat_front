import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ContratService } from '@/layout/service/contrat';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-contrat',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, ToastModule, FileUploadModule],
  templateUrl: './create-contrat.component.html',
  styleUrls: ['./create-contrat.component.scss'],
  providers: [MessageService]
})
export class CreateContratComponent {
  uploadedFiles: any[] = [];

  // objet contrat
  contrat = {
    codeAdherent: '',
    nomSouscripteur: '',
    activite: '',
    adresse: '',
    ville: '',
    codePostal: '',
    numeroTel: '',
    numPolice: '',
    dateDebut: '',
    dateFin: '',
    fractionnement: '',
    primeUnique: '',
    codeAgence: ''
  };

  constructor(private messageService: MessageService, private contratService: ContratService) {}

  onUpload(event: any) {
    for (const file of event.files) {
      this.uploadedFiles.push(file);

      if (file.name.endsWith('.pdf')) {
        this.contratService.uploadPdf(file).subscribe({
          next: (res) => {
            console.log('Liste des lignes du PDF :', res.lines);

            // Remplir automatiquement le formulaire
            this.mapPdfLinesToForm(res.lines);
          },
          error: (err) => {
            console.error('Erreur lors de l\'upload :', err);
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de traiter le fichier' });
          }
        });
      } else {
        this.messageService.add({ severity: 'warn', summary: 'Avertissement', detail: 'Seuls les fichiers PDF sont traités' });
      }
    }

    this.messageService.add({ severity: 'info', summary: 'Success', detail: 'Fichier(s) sélectionné(s)' });
  }

  // Mapper les lignes du PDF vers les champs du formulaire
  mapPdfLinesToForm(lines: string[]) {
    // Assigner chaque ligne dans l'ordre aux champs
    this.contrat.codeAdherent = lines[0] || '';
    this.contrat.nomSouscripteur = lines[1] || '';
    this.contrat.activite = lines[2] || '';
    this.contrat.adresse = lines[3] || '';
    this.contrat.ville = lines[4] || '';
    this.contrat.codePostal = lines[5] || '';
    this.contrat.numeroTel = lines[6] || '';
    this.contrat.numPolice = lines[7] || '';
    this.contrat.dateDebut = lines[8] || '';
    this.contrat.dateFin = lines[9] || '';
    this.contrat.fractionnement = lines[10] || '';
    this.contrat.primeUnique = lines[11] || '';
    this.contrat.codeAgence = lines[12] || '';
  }

  submitForm(form: any) {
    console.log('Formulaire Contrat :', this.contrat);
    console.log('Fichiers uploadés :', this.uploadedFiles);
  }
}
