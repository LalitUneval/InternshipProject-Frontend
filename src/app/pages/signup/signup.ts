
import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../environment';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Signup {
  private fb     = inject(FormBuilder);
  private http   = inject(HttpClient);
  private router = inject(Router);
  private cdr    = inject(ChangeDetectorRef);

  isLoading    = false;
  errorMessage = '';
  showPassword = false;

  strengthPercent = '0%';
  strengthColor   = 'transparent';
  strengthLabel   = 'Enter a password';

  signupForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
      ],
    ],
    role: ['', Validators.required],
  });

  onPasswordInput(value: string) {
    let score = 0;
    if (value.length >= 8)            score++;
    if (/[A-Z]/.test(value))          score++;
    if (/[a-z]/.test(value))          score++;
    if (/\d/.test(value))             score++;
    if (/[^A-Za-z0-9]/.test(value))  score++;

    const map: Record<number, { w: string; c: string; t: string }> = {
      0: { w: '0%',   c: 'transparent', t: 'Enter a password' },
      1: { w: '25%',  c: '#c0392b',     t: 'Too weak'         },
      2: { w: '50%',  c: '#e67e22',     t: 'Weak'             },
      3: { w: '75%',  c: '#f1c40f',     t: 'Fair'             },
      4: { w: '90%',  c: '#27ae60',     t: 'Strong'           },
      5: { w: '100%', c: '#1a7f5a',     t: 'Very strong'      },
    };

    this.strengthPercent = map[score].w;
    this.strengthColor   = map[score].c;
    this.strengthLabel   = map[score].t;
    this.cdr.markForCheck();  
  }

  register() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      this.cdr.markForCheck(); 
      return;
    }

    this.isLoading    = true;
    this.errorMessage = '';
    this.cdr.markForCheck(); 

    const payload = {
      email:    this.signupForm.value.email,
      password: this.signupForm.value.password,
      role:     this.signupForm.value.role,
    };

    this.http.post(`${environment.authApi}/register`, payload)
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.markForCheck();  
          alert('✅ Account created Successfully');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.isLoading    = false;
          this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
          this.cdr.markForCheck();  
          console.error(err);
        },
      });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
    this.cdr.markForCheck();  
  }
}