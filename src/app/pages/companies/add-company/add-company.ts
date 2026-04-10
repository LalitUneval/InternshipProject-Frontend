import { CommonModule } from "@angular/common";
import { Component, signal } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Company } from "../../../services/company";
import { ActivatedRoute, Route, Router } from "@angular/router";

@Component({
  selector: "app-add-company",
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./add-company.html",
  styleUrl: "./add-company.css",
})
export class AddCompany {
  isDarkMode = false;
  companyId!: number;
  isEditMode = false;

  constructor(
    private compayService: Company,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  isError = signal<any | undefined>(undefined);

  companyForm = new FormGroup({
    companyName: new FormControl("", [
      Validators.required,
      Validators.minLength(3),
    ]),

    contactEmail: new FormControl("", [Validators.required, Validators.email]),

    location: new FormControl("", [Validators.required]),

    website: new FormControl("", [Validators.required]),
  });

  ngOnInit() {
    this.isDarkMode = localStorage.getItem("theme") === "dark";
    this.applyTheme();
    this.companyId = this.route.snapshot.params["id"];

    if (this.companyId) {
      this.isEditMode = true;

      this.compayService
        .getCompanyById(this.companyId)
        .subscribe((res: any) => {
          this.companyForm.patchValue({
            companyName: res.companyName,
            contactEmail: res.contactEmail,
            location: res.location,
            website: res.website,
          });
        });
    }
  }

  private applyTheme() {
    if (this.isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }

  submitCompany() {
    if (this.companyForm.valid) {
      if (this.isEditMode) {
        this.compayService
          .updateCompany(this.companyId, this.companyForm.value)
          .subscribe({
            next: (res) => {
              console.log("Company Updated", res);
              this.router.navigate(["/dashboard/company"]);
            },

            error: (err) => {
              console.log(err);
            },
          });
      } else {
        this.compayService.addCompany(this.companyForm.value).subscribe({
          next: (res) => {
            console.log("Company Added", res);
            this.router.navigate(["/dashboard/company"]);
          },

          error: (err) => {
            console.log("Error", err.error.error);
            this.isError.set(err.error.error);
            alert("Company already register ⚠️");
          },
        });
      }
    } else {
      console.log("Form Invalid");
      this.companyForm.markAllAsTouched();
    }
  }
}
