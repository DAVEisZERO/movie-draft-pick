import { Component, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonIcon,
    IonText,
    IonImg,
    IonButton,
    IonInput,
    IonSpinner,
    IonAlert,
    AlertButton,
    AlertController,
    NavController,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { mail, person, key, lockClosed, eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { finalize } from 'rxjs';
import { passwordMatchValidator } from '../../validators/password-match.validator';

@Component({
    selector: 'app-signup',
    templateUrl: './signup.page.html',
    styleUrls: ['./signup.page.scss'],
    imports: [
        IonAlert,
        IonSpinner,
        IonInput,
        IonButton,
        IonImg,
        IonText,
        IonIcon,
        IonItem,
        IonList,
        IonCol,
        IonRow,
        IonGrid,
        IonContent,
        ReactiveFormsModule,
    ],
})

/*
################################################################################
###                                   DOCS                                   ###
################################################################################

SignUpPage
------------------
Angular/Ionic standalone component that handles user registration. Provides a
validated signup form (secure and insecure variants), handles UI state for
loading, password visibility and confirmation alerts, and delegates account
creation to AuthService. Uses Reactive Forms with synchronous validators and
custom password-match validation.

Configuration:
    - Relies on AuthService.signUp to perform network registration.
    - Uses Ionic AlertController and NavController for user feedback and navigation.
    - Form validation rules (patterns, lengths) are defined inline in the component.

Classes:
    SignUpPage
        - Exposes reactive form controls (secure and insecure variants).
        - Manages view signals: isLoading, showPassword, showConfirmation, alertData.
        - Interacts with AuthService to create accounts and display status to the user.

Functions:
    presentAlert:
        Displays a success alert after registration and navigates to /home when dismissed.

    onAlertClosed:
        Callback triggered after alert dismissal; navigates to /home and logs the event.

    toggleShowPassword:
        Toggles visibility flags for password or confirmation inputs.

    createAccount:
        Reads form values, sets loading state, calls AuthService.signUp(),
        handles success by showing an in-component alertData flag and resetting the form,
        and handles errors by showing an Ionic alert with a concise error reason.

    navigateToLogin:
        Navigates back to the login page.

    secure_form (FormGroup):
        Strongly validated form with email, name, password and confirmation controls.
        Enforces patterns, length limits and uses passwordMatchValidator.

    insecure_form [INSECURE] (FormGroup):
        Permissive form variant kept for legacy/testing; demonstrates weaker validation
        and is annotated as NOT-SECURE.

*/
export class SignUpPage {
    readonly ALERT_BUTTONS: AlertButton[];
    readonly credentials: FormGroup<{
        email: FormControl<string>;
        name: FormControl<string>;
        password: FormControl<string>;
        confirmation: FormControl<string>;
    }>;
    readonly isLoading = signal<boolean>(false);
    readonly showPassword = signal<boolean>(false);
    readonly showConfirmation = signal<boolean>(false);
    readonly alertData = signal<{ open: boolean; email: string }>({
        open: false,
        email: '',
    });

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly auth: AuthService,
        private readonly nav: NavController,
        private alertController: AlertController,
    ) {
        addIcons({ mail, key, person, lockClosed, eyeOffOutline, eyeOutline });
        this.ALERT_BUTTONS = [
            {
                text: 'Okay',
                role: 'cancel',
            },
        ];

        this.credentials = this.secure_form;
    }

    //SECURE: check the quality of password and given user inputs
    secure_form = this.formBuilder.nonNullable.group(
        {
            email: [
                '',
                [
                    Validators.required,
                    Validators.email,
                    Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
                ],
            ],
            // Enforce a domain extension (like .com, .io) which Validators.email misses
            name: [
                '',
                [
                    Validators.required,
                    Validators.minLength(3),
                    Validators.minLength(2),
                    Validators.maxLength(50),
                    Validators.pattern(/^[A-Z][a-zA-Z\s\-\']*$/),
                ],
            ],
            password: [
                '',
                [
                    Validators.required,
                    Validators.minLength(8),
                    Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/),
                ],
            ],
            confirmation: [
                '',
                [
                    Validators.required,
                    Validators.minLength(8),
                    Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/),
                ],
            ],
        },
        {
            validators: passwordMatchValidator('password', 'confirmation'),
        },
    );

    async presentAlert(email: string) {
        const alert = await this.alertController.create({
            header: 'Login Successful',
            message: `Welcome, ${email}`,
            buttons: [
                {
                    text: 'OK',
                    handler: () => {
                        // This runs when "OK" is clicked
                        this.nav.navigateRoot('/home', { relativeTo: null });
                    },
                },
            ],
        });
        await alert.present();
        // This runs when the alert is dismissed (by any means)
        await alert.onDidDismiss();
        // Trigger your function here
        this.onAlertClosed(email);
    }

    onAlertClosed(email: string) {
        console.log('Alert closed for:', email);
        this.nav.navigateRoot('/home', { relativeTo: null });
    }

    toggleShowPassword(type: 'password' | 'confirmation'): void {
        if (type === 'password') {
            this.showPassword.update((value) => !value);
        }
        if (type === 'confirmation') {
            this.showConfirmation.update((value) => !value);
        }
    }

    createAccount(): void {
        this.isLoading.set(true);

        const cred = this.credentials.getRawValue();
        const username = cred.email;
        const password = cred.password;
        const name = cred.name;

        this.auth
            .signUp(username, password, name)
            .pipe(
                finalize(() => {
                    this.isLoading.set(false);
                }),
            )
            .subscribe({
                next: (response) => {
                    console.log('SIGNUP SUCCESSFUL:');
                    //this.presentAlert(username);
                    this.alertData.set({
                        open: true,
                        email: this.credentials.controls.email.value,
                    });
                    this.credentials.reset();
                },
                error: async (err) => {
                    console.error('SIGNUP FAILED:', err);

                    // 1. Extract the error cleanly
                    const errorReason = err?.message || 'Unknown network error';

                    const alert = await this.alertController.create({
                        header: 'Registration Failed', // Clear title
                        subHeader: 'Could not create account', // Context
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

    navigateToLogin(): void {
        this.nav.navigateBack('login');
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///                                                    NOT-SECURE                                                              ///
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /// A07:2021 – Identification and Authentication Failures: ermits default, weak, or well-known passwords, such as "Password1" or "admin/admin"
    /// A03:2021 – Injection. Validated adn ssanitized data. Increase risk of unintented behaviours.
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    insecure_form = this.formBuilder.nonNullable.group(
        {
            email: ['', [Validators.required]],
            name: ['', [Validators.required]],
            password: ['', [Validators.required]],
            confirmation: ['', [Validators.required]],
        },
        {
            validators: passwordMatchValidator('password', 'confirmation'),
        },
    );
}
