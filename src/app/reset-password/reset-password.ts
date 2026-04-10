import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../environment';

//  Custom group-level validator: passwords must match 
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPwd     = control.get('newPassword')?.value;
  const confirmPwd = control.get('confirmPassword')?.value;
  return newPwd === confirmPwd ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword implements OnInit {

  private fb     = inject(FormBuilder);
  private http   = inject(HttpClient);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

 
  token: string | null = null;  
  isLoading            = false;
  resetDone            = false;
  errorMessage         = '';
  showNewPassword      = false;
  showConfirmPassword  = false;

  //  Password strength 
  strengthPercent = '0%';
  strengthColor   = 'transparent';
  strengthLabel   = 'Enter a password';

  // Live requirements flags (drives the checklist in the template)
  req = { len: false, upper: false, lower: false, num: false };

  //  Reactive form 
  resetForm = this.fb.group(
    {
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
        ],
      ],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator }
  );

  //  Convenience getter 
  get f() { return this.resetForm.controls; }

   
  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      console.warn('Reset token is missing or invalid.');
    }
  }

  //  Password strength and requirements 
  onPasswordInput(value: string): void {
    this.req = {
      len:   value.length >= 8,
      upper: /[A-Z]/.test(value),
      lower: /[a-z]/.test(value),
      num:   /\d/.test(value),
    };

    const score = Object.values(this.req).filter(Boolean).length;

    const map: Record<number, { w: string; c: string; t: string }> = {
      0: { w: '0%',    c: 'transparent', t: 'Enter a password' },
      1: { w: '25%',   c: '#c0392b',     t: 'Too weak'         },
      2: { w: '50%',   c: '#e67e22',     t: 'Weak'             },
      3: { w: '75%',   c: '#f1c40f',     t: 'Fair'             },
      4: { w: '100%',  c: '#1a7f5a',     t: 'Very strong'      },
    };

    this.strengthPercent = map[score].w;
    this.strengthColor   = score >= 3 ? map[score].c : 'var(--muted)';
    this.strengthLabel   = map[score].t;
  }

  //  Submit 
  resetPassword(): void {
    Object.values(this.resetForm.controls).forEach(c => c.markAsTouched());

    if (!this.token) {
      this.errorMessage = 'Invalid or missing token. Please request a new reset link.';
      return;
    }

    if (this.resetForm.invalid) return;

    this.isLoading    = true;
    this.errorMessage = '';

    const payload = {
      newPassword:     this.resetForm.value.newPassword,
      confirmPassword: this.resetForm.value.confirmPassword,
      token:           this.token,
    };

    this.http
      .post(`${environment.authApi}/reset-password`, payload)
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.resetDone = true;
          alert('✅ Password reset successful! Please log in with your new password.');
          this.router.navigate(['/login']); 
            // show success card, no alert()
        },
        error: (err) => {
          this.isLoading    = false;
          this.errorMessage = err.error?.message
            || 'Reset failed. The link may have expired — please request a new one.';
          console.error('Reset password error:', err);
        },
      });
  }
}