import { Component, signal } from "@angular/core";
import { JobService } from "../../services/jobService";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterLink, RouterOutlet } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { JobDetails } from "../../components/job-details/job-details";
import { Subject } from "rxjs";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";

@Component({
  selector: "app-jobs",
  imports: [CommonModule, RouterLink, FormsModule, RouterOutlet, JobDetails],
  templateUrl: "./jobs.html",
  styleUrl: "./jobs.css",
})
export class Jobs {
  constructor(
    private jobService: JobService,
    private route: ActivatedRoute,
  ) {}

  jobs = signal<any[]>([]);
  // selectedJob = signal<any | null>(null);
  selectedJobId = signal<number | null>(null);
  errorMessage = signal("");
  role = localStorage.getItem("userRole");
  loading = signal(true);
  currentPage = signal(0);
  totalPages = signal(0);
  pageSize = 6;
  keyword = "";
  jobType = "";
  city = "";
  isDarkMode = false;
  private searchSubject = new Subject<string>();

  ngOnInit() {
    const companyId = this.route.snapshot.paramMap.get("companyId");
    if (companyId) {
      this.loadCompanyJobs(Number(companyId));
    } else {
      this.loadJobs();
    }

    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.performSearch();
      });

    // Check theme preference
    this.isDarkMode = localStorage.getItem("theme") === "dark";
    this.applyTheme();
  }


  loadJobs() {
    this.loading.set(true);

    this.jobService.getJobs(this.currentPage(), this.pageSize).subscribe({
      next: (data: any) => {
        console.log("API Response:", data); // DEBUG

        if (Array.isArray(data)) {
          this.jobs.set(data);
          this.totalPages.set(1);
        } else if (data?.content) {
          this.jobs.set(data.content);
          this.totalPages.set(data.totalPages);
          this.currentPage.set(data.number);
        } else {
          this.jobs.set([]); 
        }

        this.loading.set(false);
      },

      error: (err) => {
        console.log("API ERROR:", err);
        this.jobs.set([]);
        this.loading.set(false);
      },
    });
  }

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadJobs();
    }
  }

  prevPage() {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadJobs();
    }
  }

  loadCompanyJobs(companyId: number) {
    this.loading.set(true);
    this.jobService.getJobsByCompany(companyId).subscribe({
      next: (res: any) => {
        this.jobs.set(Array.isArray(res) ? res : [res]);
        console.log(res);
        console.log(this.jobs());
        this.loading.set(false);
        this.errorMessage.set("");
      },

      error: (err) => {
        if (err) {
          this.loading.set(false);
          console.log(err);
          this.jobs.set([]);
          this.errorMessage.set("No jobs found");
        }
      },
    });
  }

  openJob(job: any) {
    this.selectedJobId.set(job.id);
  }

  closeDrawer() {
    this.selectedJobId.set(null);
  }

  onKeywordChange(value: string) {
    this.keyword = value;
    this.searchSubject.next(value);
  }

  onFilterChange() {
    this.currentPage.set(0);
    this.performSearch();
  }



  performSearch(page: number = 0) {
    const filters = {
      keyword: this.keyword,
      jobType: this.jobType,
      city: this.city,
      page: page,
      size: this.pageSize,
    };

    this.loading.set(true);
    this.jobService.searchJobs(filters).subscribe({
      next: (res: any) => {
        this.jobs.set(res.content);
        this.totalPages.set(res.totalPages);
        this.currentPage.set(res.number);
        this.loading.set(false);
      },
      error: () => {
        this.jobs.set([]);
        this.loading.set(false);
      },
    });
  }

  deleteJob(jobId: number) {
    const confirmDelete = confirm("Are you sure you want to delete this job?");

    if (confirmDelete) {
      this.jobService.deleteJob(jobId).subscribe({
        next: () => {
          console.log("Job deleted");
          this.loadJobs();
        },

        error: (err) => {
          console.log("Delete error", err);
        },
      });
    }
  }

  saveJob(jobId: number) {
    const userId = Number(localStorage.getItem("userId"));
    if (!userId) {
      alert("User not logged in");
      return;
    }
    this.jobService.saveJob(jobId, userId).subscribe({
      next: () => alert("Job saved successfully"),
      error: (err) => {
        console.error(err);
        alert("Already Saved ⚠️");
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
}
