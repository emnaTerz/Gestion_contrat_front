
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { AuthService, SigninRequest } from '@/layout/service/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,  
  imports: [
    CommonModule,
    FormsModule,
    PasswordModule,
    CheckboxModule,
    ButtonModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  checked: boolean = false;
  showPassword: boolean = false;
  errorMessage: string | null = null; 
  isDarkTheme: boolean = false;

  constructor(private router: Router, private authService: AuthService) {}
 ngOnInit(): void {
    // Supprimer le token et le rôle dès que la page login est chargée
    this.authService.logout();
  }
  onSubmit() {
    this.errorMessage = ''; // reset avant chaque tentative

    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    const request: SigninRequest = {
      email: this.email,
      password: this.password
    };

    this.authService.signin(request).subscribe({
      next: (response) => {
        console.log('Connexion réussie', response);
        
        // STOCKER LE TOKEN DANS LE LOCALSTORAGE
        if (response.token) {
          localStorage.setItem('token', response.token);
          console.log('Token stocké:', response.token);
        } else {
          console.warn('Aucun token reçu dans la réponse');
        }

        const role = response.role;

        if (role === 'ADMIN') {
          this.router.navigate(['/users']);
        } else if (role === 'USER') {
          this.router.navigate(['/Contrat']);
        } else {
          this.errorMessage = 'Rôle inconnu';
        }
      },
      error: (err) => {
        console.error('Erreur lors de la connexion:', err);
        if (err.status === 401) {
          this.errorMessage = 'Vérifiez votre nom d utilisateur ou mot de passe';
        } else {
          this.errorMessage = 'Une erreur est survenue. Veuillez réessayer plus tard.';
        }
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    document.body.classList.toggle('dark-theme', this.isDarkTheme);
  }
}