import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import {
    ModalController,
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
    IonText,
} from '@ionic/angular/standalone';

@Component({
    selector: 'app-explanation',
    templateUrl: './explanation.component.html',
    styleUrls: ['./explanation.component.scss'],
    standalone: true,
    imports: [
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
        IonText,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ExplanationComponent {
    constructor(private modalCtrl: ModalController) {}

    dismissModal() {
        this.modalCtrl.dismiss('explanation');
    }
}
