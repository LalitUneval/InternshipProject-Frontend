import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";

import { ActivatedRoute, Router } from "@angular/router";
import { JobService } from "../../services/jobService";

@Component({
  selector: "app-add-job",
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./add-job.html",
  styleUrl: "./add-job.css",
})
export class AddJob {
  isDarkMode = false;

  constructor(
    private jobService: JobService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  jobForm = new FormGroup({
    title: new FormControl("", [Validators.required, Validators.minLength(3)]),

    description: new FormControl("", [
      Validators.required,
      Validators.minLength(10),
    ]),

    city: new FormControl("", Validators.required),

    salaryMin: new FormControl(null, [Validators.required, Validators.min(1)]),

    salaryMax: new FormControl(null, [Validators.required, Validators.min(1)]),

    visaSponsored: new FormControl(false),

    jobType: new FormControl("FULL_TIME", Validators.required),
  });

  companyId!: number;
  jobId!: number;
  isEditMode = false;

  ngOnInit() {
    this.isDarkMode = localStorage.getItem("theme") === "dark";
    this.applyTheme();
    this.companyId = Number(this.route.snapshot.paramMap.get("companyId"));

    const jobIdParam = this.route.snapshot.paramMap.get("jobId");

    console.log("Company ID:", this.companyId);
    console.log("Job ID Param:", jobIdParam);

    if (jobIdParam) {
      this.jobId = Number(jobIdParam);
      this.isEditMode = true;
      this.loadJob();
    }
  }

  loadJob() {
    this.jobService.getJobById(this.jobId).subscribe({
      next: (job: any) => {
        console.log("JOB DATA:", job);

        this.jobForm.patchValue({
          title: job.title,
          description: job.description,
          city: job.city,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          visaSponsored: job.visaSponsored,
          jobType: job.jobType,
        });
        console.log(this.jobForm);
      },

      error: (err) => {
        console.log(err);
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

  createJob() {
    const min = this.jobForm.value.salaryMin;
    const max = this.jobForm.value.salaryMax;

    if (this.jobForm.invalid) {
      return;
    }

    if (min != null && max != null && max < min) {
      alert("Max salary must be greater than Min salary");
      return;
    }

    if (this.isEditMode) {
      this.jobService.updateJob(this.jobId, this.jobForm.value).subscribe({
        next: () => {
          alert("Job updated successfully");
          this.router.navigate(["/dashboard/jobs"]);
        },

        error: (err) => {
          console.log(err);
        },
      });
    } else {
      this.jobService.createJob(this.companyId, this.jobForm.value).subscribe({
        next: () => {
          alert("Job created successfully");
          this.router.navigate(["/dashboard/jobs"]);
        },

        error: (err) => {
          console.log(err);
        },
      });
    }
  }
}
