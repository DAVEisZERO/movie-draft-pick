import { Component, ViewChild } from '@angular/core';
import {
    AbstractControl,
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    ValidationErrors,
    ValidatorFn,
} from '@angular/forms';
import {
    ModalController,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonInput,
    IonGrid,
    IonCol,
    IonRow,
    IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForward, link, close } from 'ionicons/icons';
import { FilmListService, isValidUrl } from '../../services/film-list.service';

function urlValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;
        return !isValidUrl(value) ? { invalidUrl: true } : null;
    };
}

@Component({
    selector: 'app-list-url-input',
    templateUrl: './list-url-input.component.html',
    styleUrls: ['./list-url-input.component.scss'],
    standalone: true,
    imports: [
        IonText,
        IonRow,
        IonCol,
        IonGrid,
        IonInput,
        IonContent,
        IonIcon,
        IonButton,
        IonButtons,
        IonTitle,
        IonToolbar,
        IonHeader,
        ReactiveFormsModule,
    ],
})
export class ListUrlInputComponent {
    @ViewChild('input') readonly input!: IonInput;
    readonly formGroup: FormGroup;

    constructor(
        private modalCtrl: ModalController,
        private filmListService: FilmListService,
    ) {
        addIcons({ arrowForward, link, close });
        this.formGroup = new FormGroup({
            inputUrl: new FormControl<string | null>({ value: null, disabled: false }, urlValidator()),
        });
    }

    ionViewDidEnter() {
        this.input.setFocus();
    }

    async submit() {
        if (this.formGroup.invalid) return;
        const { inputUrl } = this.formGroup.value;
        this.filmListService.inputUrl = inputUrl;
        this.dismissModal();
    }

    dismissModal() {
        this.modalCtrl.dismiss('list-url-input');
    }
}
