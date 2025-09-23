
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Router } from '@angular/router';
import { ResetPasswordDTO, User, UserService } from '@/layout/service/UserService';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class UsersComponent implements OnInit {
  displayEditDialog: boolean = false; // Pour contrôler l'ouverture du popup
  displayCreateDialog: boolean = false;
  editForm!: FormGroup;      
  createForm!: FormGroup;             // Formulaire réactif pour l'édition
  selectedUser: User | null = null;   
  users: User[] = [];
  filteredUsers: User[] = [];
  globalFilter: string = '';
  loading: boolean = true;
  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder
  ) {}

 ngOnInit(): void {
  this.editForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required]],
    role: ['', Validators.required],

  });
 this.createForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required]],
      role: ['', Validators.required],
      password: ['', Validators.required], // obligatoire pour signup
    });
  this.loadUsers();
}

  loadUsers() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.filteredUsers = [...this.users];
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des utilisateurs', err);
        this.loading = false;

        if (err.status === 401 || err.status === 403) {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Session expirée ou accès non autorisé. Veuillez vous reconnecter.'
          });
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
        } else {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les utilisateurs' });
        }
      }
    });
  }

  onGlobalFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value?.toLowerCase() || '';
    this.filteredUsers = this.users.filter(user =>
      user.firstName.toLowerCase().includes(value) ||
      user.lastName.toLowerCase().includes(value) ||
      user.email.toLowerCase().includes(value) ||
      user.role.toLowerCase().includes(value)
    );
  }

  clearFilter() {
    this.globalFilter = '';
    this.filteredUsers = [...this.users];
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'ADMIN': return 'Administrateur';
      case 'USER': return 'Utilisateur';
      default: return role;
    }
  }

  deleteUser(id: number, username: string) {
    console.log("clique")
    this.confirmationService.confirm({
      message: `Voulez-vous vraiment supprimer l'utilisateur "${username}" ?`,
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.userService.deleteUser(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Utilisateur supprimé avec succès' });
            this.users = this.users.filter(u => u.id !== id);
            this.filteredUsers = this.filteredUsers.filter(u => u.id !== id);
          },
          error: (err) => {
            console.error('Erreur lors de la suppression', err);
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer l’utilisateur' });
          }
        });
      }
    });
  }

   openEditDialog(user: User) {
    this.selectedUser = user;
    this.editForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });
    this.displayEditDialog = true;
  }

  // Soumettre la modification
  submitEdit() {
    if (!this.selectedUser) return;

    const updatedUser: User = this.editForm.value;
    this.userService.updateUser(this.selectedUser.id!, updatedUser).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Utilisateur mis à jour avec succès' });
        // mettre à jour la liste locale
        const index = this.users.findIndex(u => u.id === this.selectedUser?.id);
        if (index !== -1) this.users[index] = res;
        this.filteredUsers = [...this.users];
        this.displayEditDialog = false;
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour', err);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de mettre à jour l’utilisateur' });
      }
    });
  }
   openCreateDialog() {
    this.createForm.reset(); // vide le formulaire
    this.displayCreateDialog = true;
  }

  // Soumettre la création
  submitCreate() {
    if (this.createForm.invalid) return;

    const newUser = this.createForm.value; // SignUpRequest
    this.userService.signup(newUser).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Utilisateur créé avec succès' });
        this.displayCreateDialog = false;
        this.loadUsers(); // recharger la liste
      },
      error: (err) => {
        console.error('Erreur création utilisateur', err);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de créer l’utilisateur' });
      }
    });
  }
resetPassword(user: User) {
  if (!user.id) return; // protection contre undefined

  // Construire le DTO attendu par le backend
  const dto: ResetPasswordDTO = {
    userId: user.id,
    newPassword: '123'  // valeur par défaut
  };

  this.userService.resetPassword(dto).subscribe(
    () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Succès',
        detail: `Mot de passe de ${user.firstName} ${user.lastName} réinitialisé à 123`
      });
    },
    (err) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: `Impossible de réinitialiser le mot de passe de ${user.firstName} ${user.lastName}`
      });
      console.error(err);
    }
  );
}

}
