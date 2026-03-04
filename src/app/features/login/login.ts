import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ProgressSpinnerModule,
    CheckboxModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  isLoading = signal(false);

  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false]
  });

  onSubmit() {
    if (this.loginForm.valid) {
      this.triggerLogin();
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  onSocialAuth(provider: string) {
    this.triggerLogin();
  }

  private triggerLogin() {
    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
      this.router.navigate(['/invoice']);
    }, 1000);
  }
}
