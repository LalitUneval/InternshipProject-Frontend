import { Component, signal } from "@angular/core";
import { JobService } from "../../services/jobService";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-job-applications",
  imports: [CommonModule],
  templateUrl: "./job-applications.html",
  styleUrl: "./job-applications.css",
})
export class JobApplications {
  isDarkMode = false;

  constructor(private jobService: JobService) {}

  applications = signal<any[]>([]);
  errorMessage = signal("");
  selectedIndex: number | null = null;
  activeTab: string = "UPCOMING";
  loading = signal(true);

  statuses = ["APPLIED", "SHORTLISTED", "INTERVIEWING", "REJECTED", "ACCEPTED"];

  ngOnInit() {
    this.isDarkMode = localStorage.getItem("theme") === "dark";
    this.applyTheme();
    this.loadApplications();
  }

  private applyTheme() {
    if (this.isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  filteredApplications() {
    return this.applications().filter((app) => {
      if (this.activeTab === "ACCEPTED") {
        return app.status === "ACCEPTED";
      }

      if (this.activeTab === "REJECTED") {
        return app.status === "REJECTED";
      }

      // upcoming and everything except selected & rejected
      return app.status !== "ACCEPTED" && app.status !== "REJECTED";
    });
  }

  toggleCard(index: number) {
    this.selectedIndex = this.selectedIndex === index ? null : index;
  }

  loadApplications() {
    this.loading.set(true);
    console.log("I am min ts");
    this.jobService.getApplicationsForRecruiter().subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.applications.set(res);
        this.errorMessage.set("");
        console.log(res);
      },
      error: (err) => {
        this.loading.set(false);
        console.log(err);
        this.errorMessage.set("Failed to load applications");
      },
    });
  }

  updateStatus(app: any, newStatus: string, event: Event) {
    event.stopPropagation(); 

    this.jobService.updateApplicationStatus(app.id, newStatus).subscribe({
      next: (res: any) => {
        app.status = newStatus; 
      },
      error: (err) => {
        console.error(err);
        alert("Failed to update status");
      },
    });
  }
}
