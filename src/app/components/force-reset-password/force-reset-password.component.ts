import { ResetPasswordDTO, UserService } from '@/layout/service/UserService';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-force-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule],
  templateUrl: './force-reset-password.component.html',
  styleUrls: ['./force-reset-password.component.scss']
})
export class ForceResetPasswordComponent {
  newPassword: string = '';
  confirmPassword: string = '';
  passwordStrength: number = 0; // 0 à 5 (5 critères)
  passwordColor: string = 'red';

  constructor(
    private userService: UserService,
    private router: Router,
    private messageService: MessageService
  ) {}

  // Vérifie la force du mot de passe et met à jour la couleur
  checkPasswordStrength() {
    const password = this.newPassword;
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[\W_]/.test(password)) strength++;

    this.passwordStrength = strength; // 0 à 5

    if (strength < 3) this.passwordColor = 'red';
    else if (strength < 5) this.passwordColor = 'orange';
    else this.passwordColor = 'green';
  }

  // Retourne le texte correspondant à la force du mot de passe
  getPasswordStrengthText(): string {
    if (this.passwordStrength < 3) return 'Faible';
    else if (this.passwordStrength < 5) return 'Moyenne';
    else return 'Forte';
  }

  submit(): void {
    if (!this.newPassword || !this.confirmPassword) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Veuillez remplir tous les champs' });
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Les mots de passe ne correspondent pas' });
      return;
    }

    // Validation du mot de passe
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(this.newPassword)) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un symbole.' });
      return;
    }

    const userId = localStorage.getItem('resetUserId');
    if (!userId) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de récupérer l\'utilisateur' });
      return;
    }

    const dto: ResetPasswordDTO = {
      userId: parseInt(userId),
      newPassword: this.newPassword
    };

    this.userService.resetPassword(dto).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Mot de passe changé avec succès' });
        localStorage.removeItem('resetUserId');
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors du changement de mot de passe' });
      }
    });
  }
}
