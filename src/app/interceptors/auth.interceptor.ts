// import { HttpInterceptorFn } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { CookieService } from 'ngx-cookie-service';

// // List of urls that do Not need a token
// const PUBLIC_URLS = [
//   '/api/auth/login',
//   '/api/auth/signup',
//   '/api/auth/forgot-password',
//   '/api/auth/reset-password',
  
// ];

// // This interceptor runs on every http request automatically.
// // It adds "Authorization: Bearer <token>" to all protected requests.
// export const authInterceptor: HttpInterceptorFn = (req, next) => {


//   // Check if this request is a public URL (no token needed)
//   const isPublic = PUBLIC_URLS.some(url => req.url.includes(url));

//   if (isPublic) {
//     // Public — send request without adding any header
//     return next(req);
//   }

//   // Read the token saved during login
//   const token = localStorage.getItem('accessToken');


//   if (token) {
//     // Add the token to the request header
//     const requestWithToken = req.clone({
//       headers: req.headers.set('Authorization', `Bearer ${token}`)
//     });
//     return next(requestWithToken);
//   }

//   // No token — send the request as-is
//   return next(req);
// };



import { HttpInterceptorFn, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { environment } from '../environment';

const PUBLIC_URLS = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

const BASE_URL = environment.gatewayUrl;
const REFRESH_BEFORE_MS = 5 * 60 * 1000;
// const REFRESH_BEFORE_MS = 0;

interface RefreshResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleTokenRefresh(http: HttpClient, router: Router) {
  if (refreshTimer) clearTimeout(refreshTimer);

  const expiresIn = Number(localStorage.getItem('expiresIn') || 3600);
  const delay = expiresIn * 1000 - REFRESH_BEFORE_MS;

  refreshTimer = setTimeout(() => {
    callRefreshApi(http, router).subscribe({
      next: () => {},
      error: () => {},
    });
  }, Math.max(delay, 0));
}

function callRefreshApi(http: HttpClient, router: Router) {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    localStorage.clear();
    router.navigate(['/login']);
    return throwError(() => new Error('No refresh token'));
  }

  return http
    .post<RefreshResponse>(`${BASE_URL}/api/auth/refresh`, { refreshToken })
    .pipe(
      switchMap((res) => {
        localStorage.setItem('accessToken', res.accessToken);
        localStorage.setItem('expiresIn', String(res.expiresIn));
        scheduleTokenRefresh(http, router);
        return [res.accessToken];
      }),
      catchError((err) => {
        localStorage.clear();
        router.navigate(['/login']);
        return throwError(() => err);
      })
    );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isPublic = PUBLIC_URLS.some(url => req.url.includes(url));
  if (isPublic) {
    return next(req);
  }

  const http   = inject(HttpClient);
  const router = inject(Router);

  const token = localStorage.getItem('accessToken');
  const authReq = token
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      if (isRefreshing) {
        return refreshTokenSubject.pipe(
          filter(t => t !== null),
          take(1),
          switchMap(newToken =>
            next(req.clone({
              headers: req.headers.set('Authorization', `Bearer ${newToken}`)
            }))
          )
        );
      }

      isRefreshing = true;
      refreshTokenSubject.next(null);

      return callRefreshApi(http, router).pipe(
        switchMap((newToken) => {
          isRefreshing = false;
          refreshTokenSubject.next(newToken);
          return next(req.clone({
            headers: req.headers.set('Authorization', `Bearer ${newToken}`)
          }));
        }),
        catchError((err) => {
          isRefreshing = false;
          return throwError(() => err);
        })
      );
    })
  );
};
