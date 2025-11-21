import { NgClass, NgStyle } from '@angular/common';
import { Component, ViewChild, HostListener } from '@angular/core';
import { Browser } from '@capacitor/browser';
import { Clipboard } from '@capacitor/clipboard';
import {
    InputCustomEvent,
    IonAlert,
    IonBadge,
    IonButton,
    IonButtons,
    IonChip,
    IonCol,
    IonContent,
    IonFab,
    IonFabButton,
    IonFabList,
    IonGrid,
    IonHeader,
    IonIcon,
    IonImg,
    IonInput,
    IonLabel,
    IonList,
    IonLoading,
    IonModal,
    IonRow,
    IonText,
    IonTitle,
    IonToolbar,
    MenuController,
    ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    alertCircle,
    arrowUndo,
    close,
    colorPalette,
    create,
    dice,
    download,
    ellipsisVertical,
    help,
    settings,
    link,
    open,
    reload,
    trash,
    ban,
    informationCircle,
    checkmarkCircle,
    flask,
} from 'ionicons/icons';
import { json2csv } from 'json-2-csv';
import { map } from 'rxjs';
import { FilmList } from '../classes/film-list';
import { SelectableListEntry } from '../classes/selectable-list-entry';
import { Selector } from '../classes/selector';
import { ListUrlInputComponent } from '../components/list-url-input/list-url-input.component';
import { ExplanationComponent } from '../components/explanation/explanation.component';
import { SettingsComponent } from '../components/settings/settings.component';
import { FilmListService } from '../services/film-list.service';
import { InfoPanelService } from '../services/info-panel.service';
import { SelectorService } from '../services/selector.service';
import { DraftService } from '../services/draft.service';
import { Draft } from '../classes/draft';
import { Review } from '../classes/review';
import { ReviewScoringComponent } from '../components/review-scoring/review-scoring.component';
import { faker } from '@faker-js/faker';
import { environment } from '../../environments/environment';
import { PrepareRouletteComponent } from '../components/prepare-roulette/prepare-roulette.component';

class ColorOption {
    value: string;
    contrast: string;
    placeholder: string;
    selectorName?: string;

    constructor(value: string, contrast: string, placeholder: string) {
        this.value = value;
        this.contrast = contrast;
        this.placeholder = placeholder;
    }
}

const ColorOptions = [
    new ColorOption('#673AB7', 'white', 'Faustrolomeo'),
    new ColorOption('#FF9800', 'black', 'Faustrólogo'),
    new ColorOption('#00796B', 'white', 'Faustimberlake'),
    new ColorOption('#E91E63', 'white', 'Faustinho'),
    new ColorOption('#1976D2', 'white', 'Fausterry'),
    new ColorOption('#FFD600', 'black', 'Faustimothée'),
    new ColorOption('#64DD17', 'black', 'Faustroglodita'),
    new ColorOption('#D32F2F', 'white', 'Faustopher'),
    new ColorOption('#00ACC1', 'white', 'Faustonator'),
    new ColorOption('#795548', 'white', 'Faustini'),
];

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
    standalone: true,
    imports: [
        IonBadge,
        IonLabel,
        IonAlert,
        IonFabList,
        IonFabButton,
        IonFab,
        IonTitle,
        IonButtons,
        IonToolbar,
        IonHeader,
        IonModal,
        IonImg,
        IonChip,
        IonIcon,
        IonCol,
        IonRow,
        IonGrid,
        IonButton,
        IonText,
        IonContent,
        IonInput,
        IonList,
        NgStyle,
        NgClass,
        IonLoading,
    ],
})
export class HomePage {
    @ViewChild('modal') readonly modal!: IonModal;
    readonly colorOptions: ColorOption[] = ColorOptions;
    readonly standardAlertButtons = [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Confirm', role: 'confirm' },
    ];
    isNotProd: boolean;
    currentSelector?: Selector;
    selectors: Selector[] = [];
    filmList: FilmList = new FilmList([]);
    isLoading = false;
    lastValidUrl?: string;
    activeSelector?: Selector;
    isDraftComplete = false;
    currentRoundNumber?: number;
    totalRoundsCount?: number;
    draft?: Draft;
    highlightedSelector?: Selector;
    activeGridId?: string;
    latestSelector?: Selector;

    constructor(
        private readonly modalCtrl: ModalController,
        private readonly menuCtrl: MenuController,
        private readonly filmListService: FilmListService,
        private readonly selectorService: SelectorService,
        private readonly infoPanelService: InfoPanelService,
        private readonly draftService: DraftService,
    ) {
        this.isNotProd = !environment.production;
        this.initializeIcons();
        this.setupSubscriptions();
    }

    private initializeIcons(): void {
        addIcons({
            arrowUndo,
            close,
            create,
            open,
            reload,
            dice,
            download,
            ellipsisVertical,
            colorPalette,
            alertCircle,
            link,
            trash,
            help,
            ban,
            settings,
            informationCircle,
            checkmarkCircle,
            flask,
        });
    }

    private setupSubscriptions(): void {
        this.filmListService.filmList$.subscribe((filmList) => {
            this.filmList = filmList;
            if (filmList.entries.length < 1) this.openUrlInputModal();
        });
        this.filmListService.isLoading.subscribe((loading) => (this.isLoading = loading));
        this.filmListService.lastValidUrl$
            .pipe(map((url) => url.toString()))
            .subscribe((url) => (this.lastValidUrl = url));
        this.filmListService.error.subscribe(() => {
            if (this.filmList.entries.length < 1) this.openUrlInputModal();
        });

        this.selectorService.selectors$.subscribe((selectors) => {
            selectors.forEach((selector) => {
                const matchingColor = this.colorOptions.find((color) => color.value === selector.color);
                if (matchingColor) matchingColor.selectorName = selector.name;
            });
            this.selectors = selectors;
            this.colorOptions.forEach((color) => {
                const selector = this.selectors.find((selector) => selector.color === color.value);
                if (!selector) {
                    color.selectorName = undefined;
                    return;
                }
                color.selectorName = selector.name;
            });
        });

        this.draftService.currentRoundNumber$.subscribe((roundNumber) => {
            this.currentRoundNumber = roundNumber;
        });
        this.draftService.totalRoundsCount$.subscribe((roundsCount) => {
            this.totalRoundsCount = roundsCount;
        });
        this.draftService.activeSelector$.subscribe((selector) => {
            if (selector) {
                this.latestSelector = selector;
            }
            this.activeSelector = selector;
        });
        this.draftService.draftComplete$.subscribe((complete) => {
            this.isDraftComplete = complete;
        });
        this.draftService.draft$.subscribe((draft) => {
            this.draft = draft;
        });
    }

    handleSelection(entry: SelectableListEntry): void {
        if (entry.selected || entry.disabled) return;
        this.draftService.makeSelection(entry);
        this.activeGridId = undefined;
    }

    undoLastSelection(): void {
        this.draftService.undoLastSelection();
    }

    resetList(role?: string): void {
        if (role && role !== 'confirm') return;
        this.draftService.resetDraft();
    }

    removeAllSelectors(role?: string): void {
        if (role && role !== 'confirm') return;
        this.selectorService.reset();
    }

    dismissModal(): void {
        this.modal.dismiss();
    }

    async copyRemainingTitles(): Promise<void> {
        const unselectedFilms: SelectableListEntry[] = [];
        if (!this.lastValidUrl || !this.lastValidUrl.includes('/nepismilker/')) {
            unselectedFilms.push(...this.filmList.entries.filter((entry) => !entry.selected && !entry.disabled));
        } else {
            unselectedFilms.push(...this.turboCopyAndAddExtra());
            const modal = await this.modalCtrl.create({
                id: 'PrepareRouletteComponent',
                component: PrepareRouletteComponent,
                cssClass: 'modal-fullscreen',
                componentProps: {
                    weightedList: unselectedFilms,
                },
            });
            await modal.present();
            const event = await modal.onDidDismiss<SelectableListEntry[]>();
            if (!event.data?.length) return;
            event.data.forEach((entry) => {
                if (unselectedFilms.some((film) => entry.position === film.position)) return;
                unselectedFilms.push(entry);
            });
        }
        const copyString = unselectedFilms.map((entry) => entry.title).join('\n');
        await Clipboard.write({
            string: copyString,
        });
        Browser.open({ url: 'https://wheelofnames.com/' });
    }

    exportListData(): void {
        const timestamp = new Date().toJSON().slice(0, 10);
        const filename = `${timestamp}-movie-draft-pick-export.csv`;
        const csv = json2csv(this.filmList.entries, {
            excludeKeys: [
                'selector.color',
                'selector.contrast',
                'selector.currentOrder',
                'selector.selectionsPerRound',
                'selector.totalSelectionsPerRound',
            ],
            unwindArrays: true,
            emptyFieldValue: null,
        });
        this.downloadFile(csv, filename, 'text/csv');
    }

    navigateToSourceList(): void {
        if (!this.lastValidUrl) throw new Error('no link has been provided');
        Browser.open({
            url: this.lastValidUrl,
        });
    }

    onInput(event: InputCustomEvent, color: string): void {
        const value = event.detail.value?.trim();
        const selector = this.selectors.find((selector) => selector.color === color);
        const colorOption = this.colorOptions.find((option) => option.value === color);
        if (!colorOption) throw new Error('color not found');
        colorOption.selectorName = value;

        if (!value) {
            if (selector) {
                this.removeSelector(selector);
            }
            return;
        }

        if (!selector) {
            this.addSelector(value, color, colorOption.contrast);
            return;
        }

        this.patchSelectorName(selector, value);
    }

    private patchSelectorName(selector: Selector, name: string): void {
        this.selectorService.patchSelectorName(selector, name);
    }

    private addSelector(value: string, color: string, contrast: string): void {
        const newSelector = new Selector({ name: value, color, contrast });
        this.selectorService.addSelectors([newSelector]);
    }

    private removeSelector(selector: Selector): void {
        this.selectorService.removeSelector(selector);
    }

    async openUrlInputModal(): Promise<void> {
        const modal = await this.modalCtrl.create({
            id: 'list-url-input',
            component: ListUrlInputComponent,
        });
        modal.present();
    }

    async openExplanationModal(): Promise<void> {
        const modal = await this.modalCtrl.create({
            id: 'explanation',
            component: ExplanationComponent,
        });
        modal.present();
    }

    async openSettingsModal(): Promise<void> {
        const modal = await this.modalCtrl.create({
            id: 'explanation',
            component: SettingsComponent,
        });
        modal.present();
    }

    updateList(role?: string): void {
        if (role && role !== 'confirm') return;
        if (!this.lastValidUrl) return;
        this.filmListService.inputUrl = this.lastValidUrl;
    }

    async openInfoPanel(entry: SelectableListEntry, event?: MouseEvent): Promise<void> {
        this.infoPanelService.getInfoFor(entry);
        const isLeftHalf = event ? event.clientX < window.innerWidth / 2 : true;
        const menuId = `info-panel-${isLeftHalf ? 'right' : 'left'}`;
        await this.menuCtrl.enable(true, menuId);
        await this.menuCtrl.open(menuId);
        this.activeGridId = undefined;
    }

    navigateToFilmUrl(entry: SelectableListEntry): void {
        if (!entry.urlSlug) throw new Error('no link has been provided');
        const joinUrl = `https://letterboxd.com${entry.urlSlug}`;
        Browser.open({ url: joinUrl });
        this.activeGridId = undefined;
    }

    private async downloadFile(content: string, filename: string, type: string): Promise<void> {
        const file = new Blob([content], { type });
        const tempLink = document.createElement('a');
        tempLink.download = filename;
        tempLink.href = URL.createObjectURL(file);
        tempLink.style.display = 'none';
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
    }

    highlightSelectorSelections(selector: Selector): void {
        this.highlightedSelector = selector;
    }

    clearHighlights(): void {
        this.highlightedSelector = undefined;
    }

    @HostListener('document:click', ['$event'])
    hideAllGrids(event: Event): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.container')) {
            this.activeGridId = undefined;
        }
    }

    getButtonAccessibility(action: string): { title: string; 'aria-label': string } {
        return {
            title: action,
            'aria-label': action,
        };
    }

    getFilmAccessibility(entry: SelectableListEntry): { title: string; 'aria-label': string } {
        return {
            title: `${entry.title} (${entry.year})`,
            'aria-label': `Movie poster for ${entry.title}`,
        };
    }

    private handleEvent(event: MouseEvent): void {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    handleGridToggle(entry: SelectableListEntry, event: MouseEvent): void {
        const isTouchDevice = window.matchMedia('(hover: none)').matches;

        if (isTouchDevice) {
            this.handleEvent(event);

            if (this.activeGridId !== entry.urlSlug) {
                this.activeGridId = entry.urlSlug;
                return;
            }
        } else {
            this.handleSelection(entry);
        }
    }

    handleGridAction(
        action: 'navigate' | 'info' | 'select' | 'review',
        entry: SelectableListEntry,
        event?: MouseEvent,
    ): void {
        if (event) {
            this.handleEvent(event);
        }
        switch (action) {
            case 'navigate':
                this.navigateToFilmUrl(entry);
                break;
            case 'info':
                this.openInfoPanel(entry, event);
                break;
            case 'select':
                this.handleSelection(entry);
                break;
            case 'review':
                this.selectMovieForReview(entry);
        }

        this.activeGridId = undefined;
    }

    async selectMovieForReview(entry: SelectableListEntry): Promise<void> {
        const review = new Review(entry, this.selectors);
        const modal = await this.modalCtrl.create({
            component: ReviewScoringComponent,
            componentProps: {
                review,
            },
        });
        modal.present();
    }

    simulateDraft(): void {
        if (!this.selectors.length) {
            this.addRandomSelectors();
        }
        while (!this.isDraftComplete) {
            const unselectedFilms = this.filmList.entries.filter((entry) => !entry.selected && !entry.disabled);
            const filmIndex = faker.number.int(unselectedFilms.length - 1);
            this.handleGridAction('select', unselectedFilms[filmIndex]);
        }
    }

    private addRandomSelectors(): void {
        const selectorsCount = faker.number.int({ min: 3, max: 10 });
        const colorOptions = structuredClone(ColorOptions);
        for (let i = 0; i < selectorsCount; i++) {
            const colorIndex = faker.number.int(colorOptions.length - 1);
            const fakeEvent = { detail: { value: faker.person.firstName() } } as InputCustomEvent;
            const color = colorOptions.splice(colorIndex, 1);
            this.onInput(fakeEvent, color[0].value);
        }
    }

    private turboCopyAndAddExtra(): SelectableListEntry[] {
        const minFilms = 100;
        const unselectedFilms = this.filmList.entries.filter((entry) => !entry.selected && !entry.disabled);
        const turboFilms: SelectableListEntry[] = [];
        while (turboFilms.length < minFilms) {
            turboFilms.push(...unselectedFilms);
        }
        return turboFilms;
    }
}
