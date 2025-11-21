import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { SelectableListEntry } from '../../classes/selectable-list-entry';
import { FilmListService } from '../../services/film-list.service';
import { SelectorService } from '../../services/selector.service';
import { Selector } from '../../classes/selector';
import { Subscription } from 'rxjs';
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
    IonSelect,
    IonSelectOption,
    IonCard,
    IonCardContent,
    ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle } from 'ionicons/icons';
import { NgStyle, PercentPipe } from '@angular/common';
import { faker } from '@faker-js/faker';

class WeightedSelectableListEntry extends SelectableListEntry {
    chance: number;

    constructor(
        originalListEntry: SelectableListEntry,
        totalEntryCount: number,
        private thisEntryCount = 1,
        public selectedBy?: { name?: string; color?: string },
        public addedBy?: { name?: string; color?: string },
    ) {
        super(originalListEntry);
        this.chance = this.thisEntryCount / totalEntryCount;
    }

    recalculateChance(totalEntryCount: number): number {
        this.chance = this.thisEntryCount / totalEntryCount;
        return this.chance;
    }
}

@Component({
    selector: 'app-prepare-roulette',
    templateUrl: './prepare-roulette.component.html',
    styleUrls: ['./prepare-roulette.component.scss'],
    standalone: true,
    imports: [
        IonCardContent,
        IonCard,
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
        IonSelect,
        IonSelectOption,
        NgStyle,
        PercentPipe,
    ],
})
export class PrepareRouletteComponent implements OnInit, OnDestroy {
    @Input() weightedList!: SelectableListEntry[];
    trimmedList!: WeightedSelectableListEntry[];
    availableFilms!: SelectableListEntry[];
    selectors!: Selector[];
    subscriptions: Subscription[] = [];
    selectorFilmMap = new Map<string, number>();
    disableButton = true;

    constructor(
        private filmListService: FilmListService,
        private selectorService: SelectorService,
        private modalCtrl: ModalController,
    ) {
        addIcons({ checkmarkCircle });
        this.subscriptions.push(
            this.selectorService.selectors$.subscribe((selectors) => {
                this.selectors = selectors;
            }),
        );
    }

    ngOnInit(): void {
        if (!this.weightedList) throw new Error('Did not receive expected input!');
        this.trimmedList = Array.from(new Set(this.weightedList)).map((film) => {
            const thisEntryCount = this.weightedList.filter((entry) => entry.position === film.position).length;
            return new WeightedSelectableListEntry(film, this.weightedList.length, thisEntryCount);
        });
        this.subscriptions.push(
            this.filmListService.filmList$.subscribe((filmList) => {
                this.availableFilms = filmList.entries.filter((film) => film.selected);
            }),
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    addFilm(selector: Selector, value: string): void {
        const position = parseInt(value);
        const previousPosition = this.selectorFilmMap.get(selector.color);
        this.selectorFilmMap.set(selector.color, position);
        if (previousPosition === position) return;
        if (previousPosition) {
            const weightedIndex = this.weightedList.findIndex((film) => film.position === previousPosition);
            const removedFilm = this.weightedList.splice(weightedIndex, 1);
            const trimmedIndex = this.trimmedList.findIndex((film) => film.position === previousPosition);
            this.trimmedList.splice(trimmedIndex, 1);
            this.availableFilms.splice(position - 1, 0, ...removedFilm);
        }
        const addFilm = this.availableFilms.find((film) => film.position === position);
        const addFilmIndex = this.availableFilms.findIndex((film) => film.position === position);
        if (!addFilm || addFilmIndex < 0) throw new Error('Film not available!');
        const randomIndex = faker.number.int({ min: 0, max: this.weightedList.length - 1 });
        this.weightedList.splice(randomIndex, 0, addFilm);
        const weightedFilm = new WeightedSelectableListEntry(
            addFilm,
            this.weightedList.length,
            1,
            { name: addFilm.selector?.name, color: addFilm.selector?.color },
            { name: selector.name, color: selector.color },
        );
        this.trimmedList.push(weightedFilm);
        this.trimmedList.forEach((film) => film.recalculateChance(this.weightedList.length));
        this.availableFilms.splice(addFilmIndex, 1);
        this.disableButton = !this.selectors.every((selector) =>
            this.trimmedList.some((entry) => entry.addedBy?.name === selector.name),
        );
    }

    async dismiss(): Promise<void> {
        await this.modalCtrl.dismiss(this.weightedList, 'confirm', 'PrepareRouletteComponent');
    }
}
