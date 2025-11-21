import { Component, computed, effect, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
    IonHeader,
    IonContent,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    ModalController,
    IonInput,
    IonNote,
    IonText,
    IonAlert,
    AlertButton,
    AlertController,
    IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { AuthenticatedUser } from '../../auth/interfaces/validated-auth-user.dto';
import { AuthService } from '../../auth/services/auth.service';
import { FormGroup, FormControl, Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { passwordMatchValidator } from '../../auth/validators/password-match.validator';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
    imports: [
        IonSpinner,
        IonAlert,
        IonText,
        IonNote,
        IonInput,
        IonCol,
        IonRow,
        IonGrid,
        IonIcon,
        IonButton,
        IonButtons,
        IonTitle,
        IonToolbar,
        IonContent,
        IonHeader,
        ReactiveFormsModule,
    ],
})

/*
################################################################################
###                                   DOCS                                   ###
################################################################################

SettingsComponent
------------------
Angular/Ionic standalone component that provides a comprehensive user settings
interface. Allows authenticated users to update their display name, change
password, create an account (for anonymous users), and delete their account.
Manages UI state for edit modes, loading indicators, and password visibility.
Uses Reactive Forms with strong validation and integrates with AuthService for
backend operations. Displays confirmation alerts for sensitive actions.

Configuration:
    - Relies on AuthService to perform account updates: updateDisplayName,
      updatePassword, deleteAccount, and logout.
    - Uses Ionic ModalController for modal lifecycle and AlertController for
      confirmation dialogs.
    - Form validation enforces email format, password complexity (8+ chars with
      lowercase, uppercase, digit, special char), name format, and password
      confirmation matching via custom validator.

Classes:
    SettingsComponent
        - Displays current user information via computed signal from AuthService.
        - Manages three reactive forms: changeNameForm, changePasswordForm, createAccountForm.
        - Tracks edit states via signals: isEditingName, isEditingPassword, isEditingAccount.
        - Tracks loading states via signals: isNameLoading, isPasswordLoading, isAccountLoading.
        - Handles password visibility via signals: showPassword, showConfirmation.
        - Displays alerts via alertData signal for user feedback.

Functions:
    dismiss:
        Closes the modal by calling ModalController.dismiss() without data.

    changeDisplayName:
        Validates changeNameForm, compares new name with current name,
        calls AuthService.updateDisplayName() if changed, sets isNameLoading,
        and exits edit mode on success.

    sendPasswordChange:
        Validates changePasswordForm, extracts password, calls AuthService.updatePassword(),
        sets isPasswordLoading, displays confirmation alert on success.

    presentAlertPassword:
        Creates and displays an Ionic alert confirming successful password change,
        accepts an email parameter, disables form and resets on dismissal.

    presentAlertDeletedAccount:
        Creates and displays an Ionic alert confirming account deletion,
        accepts an email parameter, calls logOut() on OK button click.

    onAlertClosed:
        Callback executed after alert dismissal; logs the email address.

    logOut:
        Calls AuthService.logout() to terminate the session and redirect user.

    removeAccount:
        Calls AuthService.deleteAccount(), sets isNameLoading, and displays
        the deletion confirmation alert on success.

    toggleShowPassword:
        Toggles visibility of password or confirmation input based on type parameter
        ('password' or 'confirmation').

    setUpEditableState (private):
        Uses effects to manage form enable/disable states based on edit mode signals:
            - Enables form and populates values when entering edit mode.
            - Disables form and resets when exiting edit mode.

    dismissModal:
        Closes the modal by calling ModalController.dismiss() with 'settings' identifier.

    setUpChangeValidation (private):
        Subscribes to changeNameForm name control value changes and compares with
        current user name to update nameDidNotChange signal; syncs form on user changes.

    user (computed signal):
        Returns the authenticated user from toSignal conversion of AuthService observable.
        Throws error if user is null.

    isAnonymousUser (computed signal):
        Boolean indicating whether current user has no email (anonymous).

    changeNameForm (FormGroup):
        Reactive form with name control enforcing: required, minLength 3, maxLength 50,
        and pattern /^[A-Z][a-zA-Z\s\-\']*$/ (capitalized name format).

    changePasswordForm (FormGroup):
        Reactive form with password and confirmation controls enforcing: required,
        minLength 8, and pattern requiring lowercase, uppercase, digit, special char.
        Uses passwordMatchValidator for confirmation matching.

    createAccountForm (FormGroup):
        Reactive form with email, name, password, confirmation controls for anonymous
        user account creation. Email and name are disabled by default. Uses passwordMatchValidator
        for confirmation matching.

    nameDidNotChange (signal):
        Boolean signal indicating whether the name form value differs from current user name.

    isEditingName (signal):
        Boolean signal tracking whether name editing mode is active.

    isNameLoading (signal):
        Boolean signal indicating whether a name update request is in progress.

    showPassword (signal):
        Boolean signal controlling password input visibility toggle.

    showConfirmation (signal):
        Boolean signal controlling password confirmation input visibility toggle.

    isEditingPassword (signal):
        Boolean signal tracking whether password editing mode is active.

    isPasswordLoading (signal):
        Boolean signal indicating whether a password update request is in progress.

    isEditingAccount (signal):
        Boolean signal tracking whether account creation mode is active.

    isAccountLoading (signal):
        Boolean signal indicating whether an account creation request is in progress.

    alertData (signal):
        Object signal tracking alert display state with open boolean, message, and header strings.

*/
export class SettingsComponent {
    private readonly nullableUser = toSignal<AuthenticatedUser | null>(this.auth.getCurrentUser());
    readonly ALERT_BUTTONS: AlertButton[];
    readonly user = computed<AuthenticatedUser>(() => {
        const user = this.nullableUser();
        if (!user) throw new Error('User not found');
        return user;
    });
    readonly isAnonymousUser = computed<boolean>(() => Boolean(!this.user().email));
    readonly nameDidNotChange = signal<boolean>(true);
    readonly isEditingName = signal<boolean>(false);
    readonly isNameLoading = signal<boolean>(false);

    readonly showPassword = signal<boolean>(false);
    readonly showConfirmation = signal<boolean>(false);
    readonly isEditingPassword = signal<boolean>(false);
    readonly isPasswordLoading = signal<boolean>(false);
    readonly isEditingAccount = signal<boolean>(false);
    readonly isAccountLoading = signal<boolean>(false);
    readonly alertData = signal<{
        open: boolean;
        message: string;
        header: string;
    }>({
        open: false,
        message: '',
        header: '',
    });
    readonly createAccountForm: FormGroup<{
        email: FormControl<string>;
        name: FormControl<string>;
        password: FormControl<string>;
        confirmation: FormControl<string>;
    }>;
    readonly changePasswordForm: FormGroup<{
        password: FormControl<string>;
        confirmation: FormControl<string>;
        nonce?: FormControl<string>;
    }>;
    readonly changeNameForm: FormGroup<{
        name: FormControl<string>;
    }>;

    constructor(
        private readonly modalCtrl: ModalController,
        private readonly auth: AuthService,
        private readonly formBuilder: FormBuilder,
        private alertController: AlertController,
    ) {
        addIcons({ close, eyeOffOutline, eyeOutline });
        this.ALERT_BUTTONS = [
            {
                text: 'Okay',
                role: 'cancel',
            },
        ];
        this.createAccountForm = this.formBuilder.nonNullable.group(
            {
                email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
                name: [{ value: '', disabled: true }, [Validators.required]],
                password: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(8)]],
                confirmation: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(8)]],
            },
            {
                validators: passwordMatchValidator('password', 'confirmation'),
            },
        );
        this.changePasswordForm = this.formBuilder.nonNullable.group(
            {
                password: [
                    { value: '', disabled: true },
                    [
                        Validators.required,
                        Validators.minLength(8),
                        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/),
                    ],
                ],
                confirmation: [
                    { value: '', disabled: true },
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
        this.changeNameForm = this.formBuilder.nonNullable.group({
            name: [
                { value: '', disabled: true },
                [
                    Validators.required,
                    Validators.minLength(3),
                    Validators.minLength(2),
                    Validators.maxLength(50),
                    Validators.pattern(/^[A-Z][a-zA-Z\s\-\']*$/),
                ],
            ],
        });
        this.setUpEditableState();
        this.setUpChangeValidation();
    }

    dismiss(): void {
        this.modalCtrl.dismiss();
    }

    changeDisplayName(): void {
        if (this.changeNameForm.invalid) return;
        const newName = this.changeNameForm.controls.name.getRawValue();
        const currentName = this.user().name ? this.user().name : 'No Name added';
        if (newName == currentName) {
            this.isEditingName.set(false);
            return;
        }
        this.isNameLoading.set(true);
        this.auth
            .updateDisplayName(newName)
            .pipe(finalize(() => this.isNameLoading.set(false)))
            .subscribe({
                next: () => this.isEditingName.set(false),
            });
    }

    sendPasswordChange(): void {
        if (this.changePasswordForm.invalid) return;
        const { password, nonce } = this.changePasswordForm.getRawValue();
        this.isPasswordLoading.set(true);
        this.auth
            .updatePassword(password)
            .pipe(
                finalize(() => {
                    this.isPasswordLoading.set(false);
                }),
            )
            .subscribe({
                next: () => {
                    this.presentAlertPassword(this.user().email!);
                },
            });
    }

    async presentAlertPassword(email: string) {
        const alert = await this.alertController.create({
            header: 'Password Change ',
            message: `Dear ${email}, your password has been successfully changed.`,
            buttons: [
                {
                    text: 'OK',
                    handler: () => {
                        // This runs when "OK" is clicked
                        this.changePasswordForm.disable();
                    },
                },
            ],
        });
        await alert.present();
        // This runs when the alert is dismissed (by any means)
        await alert.onDidDismiss();
        // Trigger your function here
        this.onAlertClosed(email);
        this.changePasswordForm.disable();
        this.changePasswordForm.reset();
        this.isEditingPassword.set(false);
    }

    async presentAlertDeletedAccount(email: string) {
        const alert = await this.alertController.create({
            header: 'Account Deleted',
            message: `Dear ${email}, your account has been successfully changed.`,
            buttons: [
                {
                    text: 'OK',
                    handler: () => {
                        this.logOut();
                    },
                },
            ],
        });
        await alert.present();
        // This runs when the alert is dismissed (by any means)
        await alert.onDidDismiss();
        // Trigger your function here
        this.onAlertClosed(email);
        this.changePasswordForm.disable();
        this.changePasswordForm.reset();
        this.isEditingPassword.set(false);
    }

    onAlertClosed(email: string) {
        console.log('Alert closed for:', email);
    }

    logOut(): void {
        this.auth.logout();
    }

    removeAccount(): void {
        this.auth
            .deleteAccount()
            .pipe(finalize(() => this.isNameLoading.set(false)))
            .subscribe({
                next: () => this.presentAlertDeletedAccount(this.user().email!),
            });
    }

    toggleShowPassword(type: 'password' | 'confirmation'): void {
        if (type === 'password') {
            this.showPassword.update((value) => !value);
        }
        if (type === 'confirmation') {
            this.showConfirmation.update((value) => !value);
        }
    }

    private setUpEditableState(): void {
        effect(() => {
            if (this.isEditingName()) {
                this.changeNameForm.enable();
            } else {
                this.changeNameForm.setValue({
                    name: this.user().name || 'No name added',
                });
                this.changeNameForm.disable();
            }
        });

        effect(() => {
            if (this.isEditingPassword()) {
                this.changePasswordForm.enable();
            } else {
                this.changePasswordForm.reset();
                this.changePasswordForm.disable();
            }
        });

        effect(() => {
            if (this.isEditingAccount()) {
                this.createAccountForm.enable();
            } else {
                this.createAccountForm.reset();
                this.createAccountForm.disable();
            }
        });
    }

    dismissModal() {
        this.modalCtrl.dismiss('settings');
    }

    private setUpChangeValidation(): void {
        this.changeNameForm.controls.name.valueChanges
            .pipe(takeUntilDestroyed())
            .subscribe((value) => this.nameDidNotChange.set(value === this.user().name || value === 'No name added'));
        effect(() => {
            const user = this.user();
            this.changeNameForm.setValue({
                name: user.name || 'No name added',
            });
            this.nameDidNotChange.set(true);
        });
    }
}
