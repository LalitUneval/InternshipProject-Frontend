import { Component, inject, signal } from "@angular/core";
import { Company } from "../../services/company";
import { Router, RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-companies",
  imports: [RouterLink, CommonModule],
  templateUrl: "./companies.html",
  styleUrl: "./companies.css",
})
export class Companies {
  constructor(
    private router: Router,
  ) {}

  private compayService = inject(Company)
  companies = signal<any[]>([]);
  role = localStorage.getItem("userRole");
  loading = signal(true);
  isDarkMode = false;

  ngOnInit() {
    this.isDarkMode = localStorage.getItem("theme") === "dark";
    this.applyTheme();
    this.loadCompanies();
  }

  private applyTheme() {
    if (this.isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }

  loadCompanies() {
    this.loading.set(true);

    this.compayService.getCompany().subscribe({
      next: (data: any) => {
        this.companies.set(data);
        this.loading.set(false);
      },

      error: (err) => {
        console.error("Error loading companies:", err);
        this.loading.set(false);

        alert("Failed to load companies. Please try again.");
      },
    });
  }

  searchCompany(event: any) {
    const keyword = event.target.value;

    if (keyword.trim() === "") {
      this.loadCompanies();
      return;
    }

    this.compayService.searchCompany(keyword).subscribe({
      next: (data: any) => {
        this.companies.set(data); // convert object → array
      },
      error: (err) => {
        console.log(err.message);
        this.companies.set([]);
      },
    });
  }

  deleteCompany(companyId: number) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this company?",
    );

    if (confirmDelete) {
      this.compayService.deleteCompany(companyId).subscribe({
        next: () => {
          console.log("Company deleted");
          this.loadCompanies();
        },

        error: (err) => {
          console.log("Delete error", err);
        },
      });
    }
  }
}
