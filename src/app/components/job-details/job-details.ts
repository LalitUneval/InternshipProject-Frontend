import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, signal } from "@angular/core";
import { JobService } from "../../services/jobService";

@Component({
  selector: "app-job-details",
  imports: [CommonModule],
  templateUrl: "./job-details.html",
  styleUrl: "./job-details.css",
})
export class JobDetails {
  @Input() jobId: number | null = null;

  @Output() close = new EventEmitter<void>();

  isApplying = false;

  constructor(private jobService: JobService) {}

  // store fetched job
  job = signal<any | null>(null);
  role = localStorage.getItem("userRole");

  // 🔥 runs whenever jobId changes
  ngOnChanges() {
    if (this.jobId) {
      this.loadJob();
    }
  }

  loadJob() {
    if (this.jobId !== null) {
      this.jobService.getJobById(this.jobId).subscribe({
        next: (res: any) => {
          this.job.set(res);
        },
        error: (err) => {
          console.error("Error loading job", err);
        },
      });
    }
  }

  applyJob() {
    if (!this.jobId) {
      alert("Job ID not found ❌");
      return;
    }

    this.jobService.applyJob(this.jobId).subscribe({
      next: () => {
        alert("Applied successfully ✅");
        this.isApplying = false;
      },
      error: (err) => {
        if (err.status === 404) {
          alert("You already applied for this job ⚠️");
        } else {
          alert("Something went wrong ❌");
        }
        this.isApplying = false;
      },
    });
  }
}
