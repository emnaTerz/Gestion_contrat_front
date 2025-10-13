import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';

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


export const appRoutes: Routes = [
    // Pages publiques
    { path: 'notfound', component: NotfoundComponent },
    { path: 'login', component: LoginComponent },

    // Pages Admin/User avec EmptyLayout (pas de menu Sakai)
    {
        path: '',
        component: EmptyLayoutComponent,
        children: [
            { path: 'action-history', component: ActionHistoryComponent, canActivate: [AuthGuard], data: { expectedRole: 'ADMIN' } },
            { path: 'users', component: UsersComponent, canActivate: [AuthGuard], data: { expectedRole: 'ADMIN' } },
            { path: 'Contrat', component: ContratComponent, canActivate: [AuthGuard], data: { expectedRole: 'USER' } },
            { path: 'contrat-list', component: ContratListComponent, canActivate: [AuthGuard], data: { expectedRole: 'USER' } },
            { path: 'Modif_Contrat/:numPolice', component: ModifierContratComponent, canActivate: [AuthGuard], data: { expectedRole: 'USER' } },
            { path: 'Landing', component: LandingComponent, canActivate: [AuthGuard], data: { expectedRole: 'USER' } },
            { path: 'force-reset-password', component: ForceResetPasswordComponent, canActivate: [AuthGuard], data: { expectedRole: 'USER' } },

    { path: '**', redirectTo: '/notfound' }
        ]
    },
];
