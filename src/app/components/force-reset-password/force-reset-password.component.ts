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
  imports: [CommonModule, FormsModule,ToastModule ],
  templateUrl: './force-reset-password.component.html',
  styleUrl: './force-reset-password.component.scss'
})

export class ForceResetPasswordComponent {
  newPassword: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';

  constructor(
    private userService: UserService,
    private router: Router,
    private messageService: MessageService
  ) {}

  submit(): void {
    if (!this.newPassword || !this.confirmPassword) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Veuillez remplir tous les champs' });
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Les mots de passe ne correspondent pas' });
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