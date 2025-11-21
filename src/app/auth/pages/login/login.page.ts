import { Component, signal } from '@angular/core';

import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
    IonCol,
    IonContent,
    IonGrid,
    IonImg,
    IonRow,
    IonText,
    IonIcon,
    IonButton,
    IonSpinner,
    IonItem,
    IonList,
    NavController,
    IonInput,
    IonModal,
    AlertController,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { mail, key, eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { PasswordResetComponent } from '../../components/password-reset/password-reset.component';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
    imports: [
        IonModal,
        IonInput,
        IonList,
        IonItem,
        IonSpinner,
        IonButton,
        IonIcon,
        IonText,
        IonImg,
        IonCol,
        IonRow,
        IonGrid,
        IonContent,
        ReactiveFormsModule,
        PasswordResetComponent,
    ],
})

/*
################################################################################
###                                   DOCS                                   ###
################################################################################

LoginPage
------------------
Angular/Ionic standalone component that handles user authentication. Provides a
validated login form with email and password inputs, manages UI state for
loading and password visibility, and delegates authentication to AuthService.
Includes password reset functionality via a modal component and displays error
alerts on failed login attempts. Uses Reactive Forms with email and password
validators.

Configuration:
    - Relies on AuthService.login to perform network authentication.
    - Uses Ionic AlertController for error feedback and NavController for navigation.
    - Form validation enforces email format and password strength requirements.
    - Password reset is handled through PasswordResetComponent modal.

Classes:
    LoginPage
        - Exposes reactive form controls (email and password).
        - Manages view signals: isLoading, showPassword, resetPasswordEmailStatus.
        - Interacts with AuthService to authenticate users and send password reset emails.
        - Handles navigation to home on successful login and to auth routes on signup/reset.

Functions:
    toggleShowPassword:
        Toggles the showPassword signal to reveal or hide the password input.

    login:
        Validates the credentials form, extracts email and password values,
        sets loading state, calls AuthService.login(), navigates to /home on success,
        and displays an error alert with the failure reason on error.

    sendPasswordResetEmail:
        Accepts an event with an email address, calls AuthService.sendPasswordReset(),
        and updates resetPasswordEmailStatus signal to reflect success or failure.

    resetModalInputs:
        Clears the resetPasswordEmailStatus signal to reset the password reset modal state.

    navigateToAuth:
        Navigates to a specified auth route (e.g. signup, login) using NavController.

    email (getter):
        Returns the email FormControl from the credentials FormGroup for template binding.

    credentials (FormGroup):
        Strongly validated form with email and password controls enforcing email format,
        password length (8+ chars), and password complexity (lowercase, uppercase, digit, special char).

    secure_form (FormGroup):
        Alternative secure form with lenient email and password validation for flexible use cases.

    insecure_form (FormGroup):
        Permissive form variant kept for legacy/testing with minimal validation.
        Annotated as NOT-SECURE and demonstrates weaker input checking.

*/
export class LoginPage {
    readonly credentials: FormGroup<{
        email: FormControl<string>;
        password: FormControl<string>;
    }>;
    readonly isLoading = signal<boolean>(false);
    readonly showPassword = signal<boolean>(false);
    readonly resetPasswordEmailStatus = signal<{
        success: boolean;
        email: string | null;
        error: boolean;
    }>({
        success: false,
        email: null,
        error: false,
    });

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly auth: AuthService,
        private readonly nav: NavController,
        private alertController: AlertController,
    ) {
        addIcons({ mail, key, eyeOffOutline, eyeOutline });
        this.credentials = this.formBuilder.nonNullable.group({
            email: [
                '',
                [
                    Validators.required,
                    Validators.email,
                    Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
                ],
            ],
            // Enforce a domain extension (like .com, .io) which Validators.email misses
            password: [
                '',
                [
                    Validators.required,
                    Validators.minLength(8),
                    Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/),
                ],
            ],
        });
    }
    secure_form = this.formBuilder.nonNullable.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
    });

    insecure_form = this.formBuilder.nonNullable.group({
        email: ['', [Validators.required]],
        password: ['', [Validators.required]],
    });

    get email(): FormControl<string> {
        return this.credentials.controls.email;
    }

    toggleShowPassword(): void {
        this.showPassword.update((value) => !value);
    }

    login(): void {
        if (this.isLoading()) return;
        if (!this.credentials.valid) {
            this.credentials.markAllAsTouched();
            return;
        }

        const cred = this.credentials.getRawValue();
        const username = cred.email;
        const password = cred.password;

        this.isLoading.set(true);
        this.auth
            .login(username, password)
            .pipe(
                finalize(() => {
                    this.isLoading.set(false);
                }),
            )
            .subscribe({
                next: (response) => {
                    console.log('LOGIN SUCCESSFULL:');
                    this.nav.navigateRoot('/home', { relativeTo: null });
                },
                error: async (err) => {
                    console.error('SIGNUP FAILED:', err);

                    // 1. Extract the error cleanly
                    const errorReason = err?.message || 'Unknown network error';

                    const alert = await this.alertController.create({
                        header: 'Log-in Failed', // Clear title
                        subHeader: 'Could not log into the Application!', // Context
                        message: `Reason: ${errorReason}`, // The technical detail (smaller font)
                        cssClass: 'custom-alert-error', // <--- Adds custom styling
                        buttons: [
                            {
                                text: 'Try Again',
                                role: 'cancel',
                                cssClass: 'alert-button-confirm', // Make the button pop
                            },
                        ],
                    });

                    await alert.present();
                },
            });
    }

    sendPasswordResetEmail(event: { email: string }): void {
        this.auth.sendPasswordReset(event).subscribe({
            next: () =>
                this.resetPasswordEmailStatus.set({
                    success: true,
                    email: event.email,
                    error: false,
                }),
            error: () =>
                this.resetPasswordEmailStatus.set({
                    success: false,
                    email: event.email,
                    error: true,
                }),
        });
    }

    resetModalInputs(): void {
        this.resetPasswordEmailStatus.set({
            success: false,
            email: null,
            error: false,
        });
    }

    navigateToAuth(url: string): void {
        this.nav.navigateForward(`auth/${url}`);
    }
}
