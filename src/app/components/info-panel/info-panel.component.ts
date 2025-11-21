import { CurrencyPipe, DecimalPipe, NgClass, NgStyle, TitleCasePipe } from '@angular/common';
import { Component } from '@angular/core';
import { Browser } from '@capacitor/browser';
import {
    IonBadge,
    IonCol,
    IonContent,
    IonGrid,
    IonIcon,
    IonImg,
    IonProgressBar,
    IonRow,
    IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { openOutline } from 'ionicons/icons';
import { InfoPanelFilmEntry, InfoPanelService } from '../../services/info-panel.service';

@Component({
    selector: 'app-info-panel',
    templateUrl: './info-panel.component.html',
    styleUrls: ['./info-panel.component.scss'],
    standalone: true,
    imports: [
        IonIcon,
        IonRow,
        IonCol,
        IonGrid,
        NgStyle,
        NgClass,
        IonText,
        IonBadge,
        IonContent,
        IonImg,
        TitleCasePipe,
        CurrencyPipe,
        DecimalPipe,
        IonProgressBar,
    ],
})
export class InfoPanelComponent {
    filmEntry?: InfoPanelFilmEntry;
    posterLoaded: boolean;

    constructor(private readonly infoPanelService: InfoPanelService) {
        addIcons({ openOutline });
        this.posterLoaded = false;
        this.infoPanelService.currentFilm$.subscribe({
            next: (entry) => {
                this.filmEntry = entry;
            },
        });
    }

    navigateToFilmUrl() {
        if (!this.filmEntry || !this.filmEntry.urlSlug) throw new Error('no link has been provided');
        const joinUrl = `https://letterboxd.com${this.filmEntry.urlSlug}`;
        Browser.open({ url: joinUrl });
    }
}
