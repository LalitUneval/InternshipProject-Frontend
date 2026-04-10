// import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// import { Router, RouterLink } from '@angular/router';
// import { HttpClient } from '@angular/common/http';

// interface LoginResponse {
//   accessToken:  string;
//   refreshToken: string;
//   tokenType:    string;
//   expiresIn:    number;
//   user: {
//     id:    number;  
//     email: string;
//     role:  string;
//   };
// }

// @Component({
//   selector: 'app-login',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, RouterLink],
//   templateUrl: './login.html',
//   styleUrl: './login.css',
//   changeDetection: ChangeDetectionStrategy.OnPush,  
// })
// export class Login {

//   private fb     = inject(FormBuilder);
//   private http   = inject(HttpClient);
//   private router = inject(Router);
//   private cdr    = inject(ChangeDetectorRef);

//   isLoading    = false;
//   errorMessage = '';
//   showPassword = false;

//   loginForm = this.fb.group({
//     email:    ['', [Validators.required, Validators.email]],
//     password: ['', Validators.required],
//   });

//   login() {
//     if (this.loginForm.invalid) {
//       this.loginForm.markAllAsTouched();
//       this.cdr.markForCheck();  
//       return;
//     }

//     this.isLoading    = true;
//     this.errorMessage = '';
//     this.cdr.markForCheck();

//     const payload = {
//       email:    this.loginForm.value.email,
//       password: this.loginForm.value.password,
//     };

//     this.http.post<LoginResponse>('http://10.36.171.105:8080/api/auth/login', payload)
//       .subscribe({
//         next: (response) => {
//           this.isLoading = false;
//           this.cdr.markForCheck(); 

//           localStorage.setItem('accessToken',  response.accessToken);
//           localStorage.setItem('refreshToken', response.refreshToken);
//           localStorage.setItem('userId',       String(response.user.id));
//           localStorage.setItem('userRole',     response.user.role);
//           localStorage.removeItem('profileComplete');
//           localStorage.removeItem('displayName');

//           if (response.user.role?.toUpperCase() === 'ADMIN') {
//             this.router.navigate(['/admin-dashboard']);
//           } else {
//             this.router.navigate(['/dashboard']);
//           }
//         },
//         error: (err) => {
//           this.isLoading    = false;
//           this.errorMessage = err.error?.message || 'Login failed. Please try again.';
//           this.cdr.markForCheck(); 
//         },
//       });
//   }

//   togglePassword() {
//     this.showPassword = !this.showPassword;
//     this.cdr.markForCheck();  
//   }
// }


import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { scheduleTokenRefresh } from '../../interceptors/auth.interceptor';
import { environment } from '../../environment';


interface LoginResponse {
  accessToken:  string;
  refreshToken: string;
  tokenType:    string;
  expiresIn:    number;
  user: {
    id:    number;
    email: string;
    role:  string;
  };
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {

  private fb     = inject(FormBuilder);
  private http   = inject(HttpClient);
  private router = inject(Router);
  private cdr    = inject(ChangeDetectorRef);

  isLoading    = false;
  errorMessage = '';
  showPassword = false;

  loginForm = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    this.isLoading    = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const payload = {
      email:    this.loginForm.value.email,
      password: this.loginForm.value.password,
    };

    this.http.post<LoginResponse>(`${environment.authApi}/login`, payload)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.cdr.markForCheck();

          // ── Store tokens ──────────────────────────────────────────
          localStorage.setItem('accessToken',  response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          localStorage.setItem('expiresIn',    String(response.expiresIn));
          
          localStorage.setItem('userId',       String(response.user.id));
          localStorage.setItem('userRole',     response.user.role);
          localStorage.removeItem('profileComplete');
          localStorage.removeItem('displayName');

          // ── Start proactive refresh timer ─────────────────────────
          scheduleTokenRefresh(this.http, this.router);             // ← new

          if (response.user.role?.toUpperCase() === 'ADMIN') {
            this.router.navigate(['/admin-dashboard']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        },
        error: (err) => {
          this.isLoading    = false;
          this.errorMessage = err.error?.message || 'Login failed. Please try again.';
          this.cdr.markForCheck();
        },
      });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
    this.cdr.markForCheck();
  }
}