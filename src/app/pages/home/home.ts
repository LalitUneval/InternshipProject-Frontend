
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { StatCard } from '../../models/stat-card';
import { Job } from '../../models/job';
import { activity } from '../../models/activity';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {

  private dashboardService = inject(DashboardService);

  stats: StatCard[]      = [];
  jobs: Job[]            = [];
  activities: activity[] = [];
  isLoading = true;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;

    forkJoin({
      stats:      this.dashboardService.getStats(),
      jobs:       this.dashboardService.getRecommendedJobs(),
      activities: this.dashboardService.getActivities()
    }).subscribe({
      next: ({ stats, jobs, activities }) => {
        this.stats      = stats;
        this.jobs       = jobs;
        this.activities = activities;
        this.isLoading  = false;
      },
      error: (err) => {
        console.error('loadData failed:', err);
        this.isLoading  = false;
      }
    });
  }
}