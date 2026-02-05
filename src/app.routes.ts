import { Routes } from '@angular/router';
import { LoginComponent } from '@/components/login/login.component';
import { UsersComponent } from '@/components/users/users.component';
import { ActionHistoryComponent } from '@/components/action-history/action-history.component';
import { AuthGuard } from '@/layout/service/AuthGuard';
import { EmptyLayoutComponent } from '@/components/EmptyLayoutComponent';
import { ContratComponent } from '@/components/contrat-component/contrat-component.component';
import { LandingComponent } from '@/components/landing/landing.component';
import { ForceResetPasswordComponent } from '@/components/force-reset-password/force-reset-password.component';
import { ModifierContratComponent } from '@/components/modifier-contrat-component/modifier-contrat-component.component';
import { ContratListComponent } from '@/components/contrat-list/contrat-list.component';
import { NotfoundComponent } from '@/components/notfound/notfound.component';
import { GarantieManagementComponent } from '@/components/garantie-management/garantie-management.component';
import { SousGarantiesComponent } from '@/components/sous-garanties/sous-garanties.component';
import { ContratIComponent } from '@/components/contrat-i/contrat-i.component';
import { Contrat260Component } from '@/components/contrat260/contrat260.component';
import { Contrat268Component } from '@/components/contrat268/contrat268.component';
import { AttestationComponent } from '@/components/attestation/attestation.component';
import { AttestationQComponent } from '@/components/attestation-q/attestation-q.component';
import { ClauseGarantieComponent } from '@/components/clause-garantie/clause-garantie.component';


export const appRoutes: Routes = [
    // Pages publiques
    { path: 'notfound', component: NotfoundComponent },
    { path: 'login', component: LoginComponent },

    {
        path: '',
        component: EmptyLayoutComponent,
        children: [
            { path: 'action-history', component: ActionHistoryComponent, canActivate: [AuthGuard], data: { expectedRole: 'ADMIN' } },
            { path: 'garanties', component: GarantieManagementComponent, canActivate: [AuthGuard], data: { expectedRole: 'ADMIN' } }, 
            { path: 'sous-garanties', component: SousGarantiesComponent, canActivate: [AuthGuard], data: { expectedRole: 'ADMIN' } }, 
            { path: 'sous-clause-garantie/:id', component: ClauseGarantieComponent, canActivate: [AuthGuard], data: { expectedRole: 'ADMIN' } }, 

            { path: 'users', component: UsersComponent, canActivate: [AuthGuard], data: { expectedRole: 'ADMIN' } },
            {  path: 'contrat/creation/260',component: Contrat260Component, canActivate: [AuthGuard], data: { expectedRole: ['USER', 'ADMIN'] }  },
            {  path: 'contrat/creation/268',component: Contrat268Component, canActivate: [AuthGuard], data: { expectedRole: ['USER', 'ADMIN'] }  },
            { path: 'contrat/creation/M', component: ContratComponent, canActivate: [AuthGuard], data: { expectedRole: ['USER', 'ADMIN'] } },
            { path: 'contrat/creation/I', component: ContratIComponent, canActivate: [AuthGuard], data: { expectedRole: ['USER', 'ADMIN'] } },
            {  path: 'contrat-list',   component: ContratListComponent, canActivate: [AuthGuard],  data: { expectedRole: ['USER', 'ADMIN'] } },
            { path: 'Modif_ContratM/:numPolice', component: ModifierContratComponent, canActivate: [AuthGuard], data: { expectedRole: ['USER', 'ADMIN'] } },
            { path: 'attestation', component: AttestationComponent, canActivate: [AuthGuard], data: { expectedRole: ['USER', 'ADMIN'] } },
            { path: 'attestationQ', component: AttestationQComponent, canActivate: [AuthGuard], data: { expectedRole: ['USER', 'ADMIN'] } },

            { path: 'Landing', component: LandingComponent, canActivate: [AuthGuard], data: { expectedRole: ['USER', 'ADMIN'] } },

            { path: 'force-reset-password', component: ForceResetPasswordComponent, canActivate: [AuthGuard], data: { expectedRole: ['USER', 'ADMIN'] }  },

    { path: '**', redirectTo: '/notfound' }
        ]
    },
];
