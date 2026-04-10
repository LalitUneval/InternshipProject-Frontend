import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { scheduleTokenRefresh } from './interceptors/auth.interceptor';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('struc01');

  private http   = inject(HttpClient);
  private router = inject(Router);

  ngOnInit() {
    if (localStorage.getItem('accessToken')) {
      scheduleTokenRefresh(this.http, this.router);
    }
  }
}