import { ContratService } from '@/layout/service/contrat';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

  constructor(private router: Router, private contratService: ContratService) {}

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
}
