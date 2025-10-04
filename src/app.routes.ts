import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { LoginComponent } from '@/components/login/login.component';
import { UsersComponent } from '@/components/users/users.component';
import { ActionHistoryComponent } from '@/components/action-history/action-history.component';
import { AuthGuard } from '@/layout/service/AuthGuard';
import { EmptyLayoutComponent } from '@/components/EmptyLayoutComponent';
import { ContratComponent } from '@/components/contrat-component/contrat-component.component';
import { ModifierContratComponent } from '@/components/modifier-contrat-component/modifier-contrat-component.component';
import { LandingComponent } from '@/components/landing/landing.component';
import { ForceResetPasswordComponent } from '@/components/force-reset-password/force-reset-password.component';


export const appRoutes: Routes = [
    // Pages publiques
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'login', component: LoginComponent },

    // Pages Admin/User avec EmptyLayout (pas de menu Sakai)
    {
        path: '',
        component: EmptyLayoutComponent,
        children: [
            { path: 'action-history', component: ActionHistoryComponent, canActivate: [AuthGuard], data: { expectedRole: 'ADMIN' } },
            { path: 'users', component: UsersComponent, canActivate: [AuthGuard], data: { expectedRole: 'ADMIN' } },
            { path: 'Contrat', component: ContratComponent, canActivate: [AuthGuard], data: { expectedRole: 'USER' } },
            { path: 'Modif_Contrat/:numPolice', component: ModifierContratComponent, canActivate: [AuthGuard], data: { expectedRole: 'USER' } },
            { path: 'Landing', component: LandingComponent, canActivate: [AuthGuard], data: { expectedRole: 'USER' } },
            { path: 'force-reset-password', component: ForceResetPasswordComponent, canActivate: [AuthGuard], data: { expectedRole: 'USER' } }


        ]
    },

    {
        path: '',
        component: AppLayout,
        children: [
            { path: '', component: Dashboard, canActivate: [AuthGuard] },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes'), canActivate: [AuthGuard] },
            { path: 'documentation', component: Documentation, canActivate: [AuthGuard] },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes'), canActivate: [AuthGuard] },
        ]
    },

    { path: '**', redirectTo: '/notfound' }
];
