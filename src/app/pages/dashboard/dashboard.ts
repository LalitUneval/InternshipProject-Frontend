import { Component, OnInit, OnDestroy, inject } from "@angular/core";
import {
  RouterLink,
  RouterOutlet,
  Router,
  NavigationEnd,
} from "@angular/router";
import { CommonModule } from "@angular/common";
import { Subscription } from "rxjs";
import { filter } from "rxjs/operators";
import { ProfileModal } from "../../components/profile-modal/profile-modal";
import {
  ProfileService,
  UserProfileResponse,
} from "../../services/profile.service";
import { CookieService } from "ngx-cookie-service";
import { AiChat } from "../../components/ai-chat/ai-chat";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, ProfileModal, AiChat],
  templateUrl: "./dashboard.html",
  styleUrl: "./dashboard.css",
})
export class Dashboard implements OnInit, OnDestroy {
  private cookieService = inject(CookieService);

  exsitingSkill='';
  
  sidebarOpen = true;
  profileOpen = false;
  servicesOpen = false;
  isDarkMode = false;

  role = localStorage.getItem("userRole");

  // User display name — from profile or fallback to role
  displayName = localStorage.getItem("userRole") || "User";

  // Banner: "Complete your profile" — shown on nav when profile is missing
  showProfileBanner = false;

  // Modal: the popup form
  showProfileModal = false;

  // true = editing existing profile, false = creating for first time
  isEditMode = false;

  // Holds existing profile data when in edit mode
  existingProfile: UserProfileResponse | null = null;

  // Used to unsubscribe from router events when component is destroyed
  private routerSub!: Subscription;

  constructor(
    private router: Router,
    private profileService: ProfileService,
  ) {}

  ngOnInit() {
    // Restore theme preference
    this.isDarkMode = localStorage.getItem("theme") === "dark";
    this.applyTheme();

    //  Profile check optimization 
    // Skip the API call ONLY when both profileComplete and the
    // cached displayName exist.  If either is missing we call the
    // API once to fetch/cache them, then never call it again.
    // The flags are cleared on logout so the next login re-verifies.
    const profileAlreadyDone = localStorage.getItem('profileComplete');
    const cachedName         = localStorage.getItem('displayName');

    if (profileAlreadyDone === "true" && cachedName) {
      // Both flags present — use cached data, no API call needed
      this.displayName = cachedName;
      this.showProfileBanner = false;
      return;
    }

    // Profile status unknown — hit the api once to check
    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        // Profile exists — cache data and mark as complete
        this.existingProfile = profile;
        console.log(this.existingProfile);
        localStorage.setItem("profileComplete", "true");
        // Cache the display name so future visits skip the call
        const name =
          profile.fullName || localStorage.getItem("userRole") || "User";
        localStorage.setItem("displayName", name);
        this.displayName = name;
        // No banner needed
        this.showProfileBanner = false;
      },
      error: () => {
        // Profile does not exist yet — show role as fallback
        this.displayName = localStorage.getItem("userRole") || "User";
        // Don't show the banner immediately on load.
        // Show it only when the user navigates to a child page.
        localStorage.removeItem("profileComplete");
        this.listenForNavigation();
      },
    });
  }

  menuOpen: string | null = null;

  toggleMenu(menu: string) {
    this.menuOpen = this.menuOpen === menu ? null : menu;
  }

  // Watch for route changes inside the dashboard.
  // When user clicks any sidebar link, show the banner if profile is missing.
  listenForNavigation() {
    this.routerSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        // Only show banner if profile is still not done
        const done = localStorage.getItem("profileComplete");
        if (!done) {
          this.showProfileBanner = true;
        }
      });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
  toggleProfile() {
    this.profileOpen = !this.profileOpen;
  }
  toggleServices() {
    this.servicesOpen = !this.servicesOpen;
  }

  // Called when user clicks "Complete Now" on the banner
  openCreateModal() {
    this.isEditMode = false;
    this.showProfileModal = true;
    this.showProfileBanner = false;
  }

  // Called when user clicks "Edit Profile" in the dropdown
  openEditModal() {
    this.isEditMode = true;
    this.profileOpen = false; // close the dropdown
    this.showProfileModal = true;
  }

  // Called when profile is saved/updated successfully from the modal
  onProfileSaved(updatedProfile: UserProfileResponse) {
    this.existingProfile = updatedProfile;
    this.showProfileModal = false;
    this.showProfileBanner = false;
    const name =
      updatedProfile.fullName || localStorage.getItem("userRole") || "User";
    this.displayName = name;
    localStorage.setItem("profileComplete", "true");
    localStorage.setItem("displayName", name);
  }

  // Called when user clicks X on the modal
  onModalClosed() {
    this.showProfileModal = false;
    // If profile still not done, show banner again
    const done = localStorage.getItem("profileComplete");
    if (!done) {
      this.showProfileBanner = true;
    }
  }

  logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("profileComplete");
    localStorage.removeItem("displayName");
    localStorage.removeItem("userId");
    this.router.navigate(["/"]);

  }

  ngOnDestroy() {
    // Clean up the subscription to avoid memory leaks
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem("theme", this.isDarkMode ? "dark" : "light");
    this.applyTheme();
  }

  private applyTheme() {
    if (this.isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }
  getInitials(name: string): string {
    const parts = name
      .trim()
      .split(" ")
      .filter((p) => p.length > 0);
    if (parts.length === 0) return "A";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
