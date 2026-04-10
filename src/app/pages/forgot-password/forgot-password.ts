import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private fb     = inject(FormBuilder);
  private http   = inject(HttpClient);
  private router = inject(Router);

  isLoading    = false;
  errorMessage = '';
  linkSent     = false;

  resetForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  sendResetLink() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading    = true;
    this.errorMessage = '';

    this.http
      .post(`${environment.authApi}/forgot-password`, {
        email: this.resetForm.value.email,
      })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.linkSent  = true;          
          alert('✅ Reset link sent to your mail');
        },
        error: (err) => {
          this.isLoading    = false;
          this.errorMessage = err.error?.message || 'Something went wrong. Please try again.';
          console.error(err);
        },
      });
  }
}
