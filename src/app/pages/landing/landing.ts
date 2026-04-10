
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.html',
  styleUrls: ['./landing.css'],
})
export class Landing {
  constructor(private router: Router) {}

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }

  features = [
    {
      icon: '🏠',
      title: 'Find Housing',
      desc: 'Browse verified listings, connect with landlords, and secure your new home before you even land.',
    },
    {
      icon: '💼',
      title: 'Discover Jobs',
      desc: 'Explore opportunities matched to your skills and visa type, posted by immigrant-friendly employers.',
    },
    {
      icon: '🤝',
      title: 'Build Community',
      desc: 'Join groups of people from your country, city, or profession. You are never alone in a new place.',
    },
    {
      icon: '💬',
      title: 'Real-Time Chat',
      desc: 'Message anyone on the platform directly. Group chats, private messages — all in one place.',
    },
  ];

  steps = [
    { num: '01', title: 'Create your profile', desc: 'Tell us where you are from, where you are going, and what you need.' },
    { num: '02', title: 'Explore your new city', desc: 'Search housing, browse jobs, and find community groups near you.' },
    { num: '03', title: 'Connect & settle in', desc: 'Chat with locals, apply for rooms, and grow your network from day one.' },
  ];

  testimonials = [
    {
      name: 'Priya Sharma',
      from: 'India → San Francisco',
      text: 'Trek helped me find an apartment and a job within two weeks of arriving. I do not know what I would have done without it.',
      initials: 'PS',
    },
    {
      name: 'Carlos Mendez',
      from: 'Mexico → New York',
      text: 'The community groups were a lifesaver. I found people from my hometown who showed me the ropes.',
      initials: 'CM',
    },
    {
      name: 'Aisha Nkrumah',
      from: 'Ghana → London',
      text: 'Finally a platform that understands what immigrants actually need. Housing, jobs, and community — all in one.',
      initials: 'AN',
    },
  ];
}