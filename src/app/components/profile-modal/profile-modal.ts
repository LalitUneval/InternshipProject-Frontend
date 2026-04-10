import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService, UserProfileResponse } from '../../services/profile.service';
import { UserProfile } from '../../models/user-profile';

@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-modal.html',
  styleUrl: './profile-modal.css',
})
export class ProfileModal implements OnInit {

  private profileService = inject(ProfileService);

  @Input() isEditMode = false;
  @Input() existingProfile: UserProfileResponse | null = null;

  @Output() profileSaved = new EventEmitter<UserProfileResponse>();
  @Output() closeModal   = new EventEmitter<void>();

  isLoading      = false;
  errorMessage   = '';
  successMessage = '';

 
  profile: UserProfile = {
    id:            0,
    fullName:      '',
    originCountry: '',
    currentCity:   '',
    visaType:      '',
    skills:        '',
    phoneNumber:   '',
  };

  ngOnInit() {
    if (this.isEditMode && this.existingProfile) {

      this.profile = {
        id:            this.existingProfile.id ?? 0,
        fullName:      this.existingProfile.fullName,
        originCountry: this.existingProfile.originCountry,
        currentCity:   this.existingProfile.currentCity,
        visaType:      this.existingProfile.visaType,
        skills:        this.existingProfile.skills,
        phoneNumber:   this.existingProfile.phoneNumber,
      };
    }
  }

  saveProfile() {
    if (
      !this.profile.fullName      ||
      !this.profile.originCountry ||
      !this.profile.currentCity   ||
      !this.profile.visaType      ||
      !this.profile.skills        ||
      !this.profile.phoneNumber
    ) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    this.isLoading    = true;
    this.errorMessage = '';

    if (this.isEditMode) {
      const userId = Number(localStorage.getItem('userId'));

      const updatePayload = {
        fullName:    this.profile.fullName,
        currentCity: this.profile.currentCity,
        visaType:    this.profile.visaType,
        skills:      this.profile.skills,
      };

      this.profileService.updateProfile(userId, updatePayload).subscribe({
        next: () => {
          this.isLoading      = false;
          this.successMessage = 'Profile updated successfully!';
          const updated: UserProfileResponse = { ...this.profile };
          setTimeout(() => { this.profileSaved.emit(updated); }, 800);
        },
        error: (err) => {
          this.isLoading    = false;
          this.errorMessage = err.error?.message || 'Could not update profile. Please try again.';
        }
      });

    } else {
      this.profileService.saveProfile(this.profile).subscribe({
        next: () => {
          this.isLoading      = false;
          this.successMessage = 'Profile created successfully!';
          const created: UserProfileResponse = { ...this.profile };
          setTimeout(() => { this.profileSaved.emit(created); }, 800);
        },
        error: (err) => {
          this.isLoading    = false;
          this.errorMessage = err.error?.message || 'Could not save profile. Please try again.';
        }
      });
    }
  }

  dismiss() {
    this.closeModal.emit();
  }
}