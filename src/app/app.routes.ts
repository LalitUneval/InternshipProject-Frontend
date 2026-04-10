import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Signup } from './pages/signup/signup';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { ResetPassword } from './reset-password/reset-password';
import { Dashboard } from './pages/dashboard/dashboard';
import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';
import { Home } from './pages/home/home';
import { About } from './pages/about/about';
import { Contact } from './pages/contact/contact';
import { Housing } from './pages/housing/housing';
import { authGuard } from './auth-guard';
import { adminGuard } from './admin-guard';

import { Community } from './components/community/community';  // ← import Community shell
// ADD this line after the last import:
import { Landing } from './pages/landing/landing';
import { Services } from './pages/services/services';
import { Jobs } from './pages/jobs/jobs';
import { AddJob } from './components/add-job/add-job';
import { SaveJob } from './components/save-job/save-job';
import { ApplyedJobs } from './components/applyed-jobs/applyed-jobs';
import { JobApplications } from './components/job-applications/job-applications';
import { Companies } from './pages/companies/companies';
import { AddCompany } from './pages/companies/add-company/add-company';

export const routes: Routes = [


  
  { path: '', component: Landing },



  //  Public routes 
  { path: 'login',            component: Login },
  { path: 'signup',           component: Signup },
  { path: 'forgot-password',  component: ForgotPassword },
  { path: 'reset-password',   component: ResetPassword },

  //  Protected routes 
  {
    path: 'admin-dashboard',
    component: AdminDashboard,
    canActivate: [adminGuard]
  },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
    children: [
      { path: '',          redirectTo: 'home', pathMatch: 'full' },
      { path: 'home',      component: Home },
      { path: 'about',     component: About },
      { path: 'contact',   component: Contact },
      { path: 'housing',   component: Housing },
    
      { path: 'community', component: Community },  
       { path: 'services', component: Services },
       {
        path: 'jobs',
        children: [
          { path: '', component: Jobs },
          { path: 'company/:companyId', component: Jobs },
          {path:'add-jobs/:companyId', component:AddJob},
          {path:'edit/:jobId', component:AddJob},
          {path:'saved', component:SaveJob},
          {path:'applyed', component:ApplyedJobs},
          {path:'job-applications', component:JobApplications},
        ]
      },
      {
        path: 'company',
        children: [
          { path: '', component: Companies },
          { path: 'add-company', component: AddCompany },
          { path: 'edit/:id', component: AddCompany },
        ]
      },

    ]
  }
];