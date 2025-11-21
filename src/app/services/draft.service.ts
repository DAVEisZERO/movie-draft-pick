import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, combineLatest } from 'rxjs';
import { Draft, DraftStateData } from '../classes/draft';
import { FilmListService } from './film-list.service';
import { SelectorService } from './selector.service';
import { Selector } from '../classes/selector';
import { SelectableListEntry } from '../classes/selectable-list-entry';
import { FilmList } from '../classes/film-list';
import { Storage } from '@ionic/storage-angular';

@Injectable({
    providedIn: 'root',
})
export class DraftService {
    private draft?: Draft;
    private activeSelector?: Selector;
    private stateData?: DraftStateData;
    private filmList: FilmList;
    private selectors: Selector[];
    private readonly filmListKey: string;
    private readonly selectorsKey: string;
    private readonly _currentRoundNumber: ReplaySubject<number | undefined>;
    private readonly _totalRoundsCount: ReplaySubject<number | undefined>;
    private readonly _activeSelector: ReplaySubject<Selector | undefined>;
    private readonly _draftComplete: ReplaySubject<boolean>;
    private readonly _draft: ReplaySubject<Draft | undefined>;

    get currentRoundNumber$(): Observable<number | undefined> {
        return this._currentRoundNumber.asObservable();
    }

    get totalRoundsCount$(): Observable<number | undefined> {
        return this._totalRoundsCount.asObservable();
    }

    get activeSelector$(): Observable<Selector | undefined> {
        return this._activeSelector.asObservable();
    }

    get draftComplete$(): Observable<boolean> {
        return this._draftComplete.asObservable();
    }

    get draft$(): Observable<Draft | undefined> {
        return this._draft.asObservable();
    }

    constructor(
        private filmListService: FilmListService,
        private selectorService: SelectorService,
        private storage: Storage,
    ) {
        this.filmList = new FilmList([]);
        this.selectors = [];
        this.filmListKey = 'film-list';
        this.selectorsKey = this.selectorService.selectorsKey;
        this._currentRoundNumber = new ReplaySubject<number | undefined>(1);
        this._totalRoundsCount = new ReplaySubject<number | undefined>(1);
        this._activeSelector = new ReplaySubject<Selector | undefined>(1);
        this._draftComplete = new ReplaySubject<boolean>(1);
        this._draft = new ReplaySubject<Draft | undefined>(1);

        this.filmListService.filmList$.subscribe((filmList) => {
            this.filmList = filmList;
            this.saveState();
        });
        this.selectorService.selectors$.subscribe((selectors) => {
            this.selectors = selectors;
            this.saveState();
        });

        combineLatest([this.filmListService.filmList$, this.selectorService.selectors$]).subscribe(
            ([filmList, selectors]) => {
                this.resetDraftWithoutStorage();
                if (filmList.entries.length > 0 && selectors.length > 0) {
                    this.initializeDraft(filmList, selectors);
                    return;
                }
                delete this.draft;
                this._currentRoundNumber.next(undefined);
                this._totalRoundsCount.next(undefined);
                this._activeSelector.next(undefined);
                this._draft.next(undefined);
            },
        );

        this.getSavedState();
    }

    private initializeDraft(filmList: FilmList, selectors: Selector[]): void {
        this.draft = new Draft(filmList.availableEntries, selectors);
        this._draft.next(this.draft);
        this.draft.stateData$.subscribe((stateData) => {
            this.stateData = stateData;
            this._currentRoundNumber.next(stateData.roundNumber);
            this._totalRoundsCount.next(stateData.roundsCount);
        });
        this.draft.activeSelector$.subscribe((selector) => {
            this._activeSelector.next(selector);
            this.activeSelector = selector;
        });
        this.draft.draftComplete$.subscribe((complete) => {
            this._draftComplete.next(complete);
            if (complete) {
                this._activeSelector.next(undefined);
                this.activeSelector = undefined;
            }
        });
    }

    makeSelection(entry: SelectableListEntry): void {
        if (!this.activeSelector) return;
        this.makeSelectionForSelector(entry, this.activeSelector);
    }

    private makeSelectionForSelector(entry: SelectableListEntry, selector: Selector): void {
        if (!this.draft) return;
        if (!this.stateData) return;
        entry.setSelectionStateData({
            ...this.stateData,
            globalOrder: this.stateData.globalOrder + 1,
            individualSelectorOrder: this.stateData.individualSelectorOrder + 1,
            turnOrder: this.stateData.turnOrder + 1,
            roundOrder: this.stateData.roundOrder + 1,
        });
        this.filmList.selectEntry(entry, selector);
        this.draft.makeSelection();
        this.saveState();
    }

    undoLastSelection(): void {
        if (!this.draft) return;
        const lastSelectedEntry = this.filmList.entries.find(
            (entry) => entry.globalOrder === this.filmList.currentOrder,
        );
        if (!lastSelectedEntry) return;
        this.undoSelection(lastSelectedEntry);
        this.draft.undoSelection();
        this.saveState();
    }

    private undoSelection(entry: SelectableListEntry) {
        this.filmList.deselectEntry(entry);
    }

    private resetDraftWithoutStorage() {
        if (!this.draft) return;
        this.filmList.reset();
        this.draft.reset();
    }

    resetDraft(): void {
        this.resetDraftWithoutStorage();
        this.saveState();
    }

    private saveState() {
        this.storage.set(this.filmListKey, this.filmList);
        this.storage.set(this.selectorsKey, this.selectors);
    }

    private async getSavedState() {
        const filmList: FilmList | null = await this.storage.get(this.filmListKey);
        const selectors: Selector[] | null = await this.storage.get(this.selectorsKey);
        this.setState(filmList ?? new FilmList([]), selectors ?? []);
    }

    private setState(oldList: FilmList, oldSelectors: Selector[]) {
        const newList = new FilmList(
            oldList.entries.map((entry) => {
                return new SelectableListEntry(entry);
            }),
        );
        this.filmListService.filmList$ = newList;
        const uniqueSelectors = oldSelectors.map((selector) => {
            return new Selector(selector);
        });
        this.selectorService.addSelectors(uniqueSelectors);
        oldList.entries
            .filter((oldEntry) => oldEntry.selected)
            .sort((a, b) => {
                if (a.globalOrder && b.globalOrder) return a.globalOrder - b.globalOrder;
                throw new Error('entry should never be selected but have no selection order');
            })
            .forEach((oldEntry) => {
                const selector = uniqueSelectors.find((selector) => selector.equals(oldEntry.selector));
                const selectedEntry = this.filmList.entries.find(
                    (newEntry) => newEntry.title === oldEntry.title && newEntry.year === oldEntry.year,
                );
                if (!selectedEntry || !selector) throw new Error('selectors and film list mismatch');
                this.makeSelectionForSelector(selectedEntry, selector);
            });
    }
}
