import { Component, signal } from "@angular/core";
import { JobService } from "../../services/jobService";
import { CommonModule } from "@angular/common";
import { JobDetails } from "../job-details/job-details";

@Component({
  selector: "app-save-job",
  imports: [CommonModule, JobDetails],
  templateUrl: "./save-job.html",
  styleUrl: "./save-job.css",
})
export class SaveJob {
  isDarkMode = false;
  savedJobs = signal<any[]>([]);
  selectedJob = signal<any | null>(null);
  selectedJobId = signal<number | null>(null);
  loading = signal(true);

  constructor(private jobService: JobService) {}

  ngOnInit() {
    this.isDarkMode = localStorage.getItem("theme") === "dark";
    this.applyTheme();
    this.loadSavedJobs();
  }

  loadSavedJobs() {
    const userId = Number(localStorage.getItem("userId"));

    this.loading.set(true);

    this.jobService.getSavedJobs(userId).subscribe({
      next: (res: any) => {
        this.savedJobs.set(res);
        console.log(res);
        this.loading.set(false);
      },

      error: (err) => {
        console.log("Error:", err);
        this.loading.set(false);

        alert("Failed to load saved jobs ❌");
      },
    });
  }

  private applyTheme() {
    if (this.isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }

  unsaveJob(jobId: number) {
    const userId = Number(localStorage.getItem("userId"));

    this.jobService.unsaveJob(jobId, userId).subscribe(() => {
      
      this.savedJobs.update((jobs) =>
        jobs.filter((job) => job.jobId !== jobId),
      );
    });
  }

  openJob(job: any) {
    this.selectedJobId.set(job.jobId);
  }

  closeDrawer() {
    this.selectedJobId.set(null);
  }
}
