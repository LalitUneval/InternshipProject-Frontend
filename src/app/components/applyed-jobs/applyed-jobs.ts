import { Component, signal } from "@angular/core";
import { JobService } from "../../services/jobService";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-applyed-jobs",
  imports: [CommonModule],
  templateUrl: "./applyed-jobs.html",
  styleUrl: "./applyed-jobs.css",
})
export class ApplyedJobs {
  isDarkMode = false;

  constructor(private jobService: JobService) {}

  selectedJobId = signal<number | null>(null);

  jobs = signal<any[]>([]);
  ngOnInit() {
    this.isDarkMode = localStorage.getItem("theme") === "dark";
    this.applyTheme();
    this.loadApplyedJob();
  }

  loadApplyedJob() {
    const userId = Number(localStorage.getItem("userId"));

    this.jobService.getApplyedJob(userId).subscribe((res: any) => {
      this.jobs.set(res);
      console.log(res);
    });
  }

  private applyTheme() {
    if (this.isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }

  activeTab: string = "ALL";

  setTab(tab: string) {
    this.activeTab = tab;
  }

  filteredJobs() {
    return this.jobs().filter((job) => {
      if (this.activeTab === "ACCEPTED") {
        return job.status === "ACCEPTED";
      }

      if (this.activeTab === "REJECTED") {
        return job.status === "REJECTED";
      }

      if (this.activeTab === "UPCOMING") {
        return job.status !== "ACCEPTED" && job.status !== "REJECTED";
      }

      return true; 
    });
  }

  
}
