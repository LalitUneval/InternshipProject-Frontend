import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);

  const token = localStorage.getItem('accessToken');
  const role = localStorage.getItem('userRole');

  if (token && role && role.toUpperCase() === 'ADMIN') {
    return true; // Admin user logged in
  } else if (token) {
    
    router.navigate(['/dashboard']);
    return false;
  } else {

    router.navigate(['/login']);
    return false;
  }
};
