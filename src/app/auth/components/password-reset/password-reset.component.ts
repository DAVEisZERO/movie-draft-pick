import { Component, effect, input, OnInit, output, signal } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { close, mail, send } from 'ionicons/icons';
import {
    IonItem,
    IonIcon,
    IonInput,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonCardTitle,
    IonButton,
    IonList,
    ModalController,
    IonText,
} from '@ionic/angular/standalone';
import { takeWhile, timer } from 'rxjs';

@Component({
    selector: 'app-password-reset',
    templateUrl: './password-reset.component.html',
    styleUrls: ['./password-reset.component.scss'],
    imports: [
        IonText,
        IonList,
        IonButton,
        IonCardTitle,
        IonCardContent,
        IonCardHeader,
        IonCard,
        IonInput,
        IonIcon,
        IonItem,
        ReactiveFormsModule,
    ],
})

/*
################################################################################
###                                   DOCS                                   ###
################################################################################

PasswordResetComponent
------------------
Angular/Ionic standalone component that provides a modal interface for
requesting a password reset email. Manages email input validation, tracks
cooldown state to prevent email spam, and emits confirmation events to parent
components. Uses Reactive Forms with email validation and integrates with
Ionic ModalController for modal lifecycle management.

Configuration:
    - COOLDOWN_SECONDS (60) defines the wait period between email reset requests.
    - Relies on parent component to listen for confirm output event and call
      AuthService.sendPasswordReset().
    - Form validation enforces email format using standard Angular validators.

Classes:
    PasswordResetComponent
        - Manages email input form with required and email format validators.
        - Tracks cooldown state via signals: canResend, remainingTime.
        - Accepts initialAddress and emailStatus inputs to pre-fill and react to status changes.
        - Emits confirm output event with the email address when reset is requested.

Functions:
    ngOnInit:
        Initializes the form email control with the initialAddress input value.

    dismiss:
        Closes the modal by calling ModalController.dismiss() without returning data.

    sendEmail:
        Validates form state and cooldown, extracts the email address (from form or parameter),
        emits the confirm output event with the email, and resets the form for next use.
        - Respects canResend signal to prevent sending during cooldown period.
        - Accepts optional address parameter for programmatic email submission.

    startCooldown (private):
        Initiates a countdown timer after successful email submission:
            - Sets canResend to false and initializes remainingTime.
            - Uses RxJS timer(0, 1000) with takeWhile to decrement remainingTime each second.
            - Completes the timer when remainingTime reaches 1, re-enabling send button.

    form (FormGroup):
        Reactive form with email FormControl enforcing required and email format validators.

    initialAddress (input):
        String input accepting a pre-filled email address for the password reset modal.

    emailStatus (input):
        Object input tracking the status of the password reset request:
            - success: boolean indicating successful email send.
            - email: string or null of the sent email address.
            - error: boolean indicating send failure.

    confirm (output):
        Event emitter that broadcasts { email: string } when the user submits the password reset form.

    remainingTime (signal):
        Numeric signal tracking countdown seconds remaining before the next email can be sent.

    canResend (signal):
        Boolean signal indicating whether the user can submit another password reset request.

*/
export class PasswordResetComponent implements OnInit {
    private readonly COOLDOWN_SECONDS: number;
    readonly form: FormGroup<{
        email: FormControl<string>;
    }>;
    readonly remainingTime = signal<number>(0);
    readonly canResend = signal<boolean>(true);
    readonly initialAddress = input<string>('');
    readonly emailStatus = input<{
        success: boolean;
        email: string | null;
        error: boolean;
    }>({ success: false, email: null, error: false });
    readonly confirm = output<{ email: string }>();

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly modalCtrl: ModalController,
    ) {
        addIcons({ close, mail, send });
        this.COOLDOWN_SECONDS = 60;
        this.form = this.formBuilder.nonNullable.group({
            email: ['', [Validators.required, Validators.email]],
        });
        effect(() => {
            const status = this.emailStatus();
            if (status.success) {
                this.startCooldown();
            }
        });
    }

    ngOnInit(): void {
        const initialValue = this.initialAddress();
        this.form.controls.email.setValue(initialValue);
    }

    dismiss(): void {
        this.modalCtrl.dismiss();
    }

    sendEmail(address?: string | null): void {
        if (!this.canResend()) return;
        if (!this.form.valid && !address) return;

        const email = this.form.controls.email.value ?? address;
        this.confirm.emit({
            email: email,
        });
        this.form.reset();
    }

    private startCooldown(): void {
        this.canResend.set(false);
        this.remainingTime.set(this.COOLDOWN_SECONDS + 1);

        timer(0, 1000)
            .pipe(takeWhile(() => this.remainingTime() > 1))
            .subscribe({
                next: () => this.remainingTime.update((t) => t - 1),
                complete: () => this.canResend.set(true),
            });
    }
}
