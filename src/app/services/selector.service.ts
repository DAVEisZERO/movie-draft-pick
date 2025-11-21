import { Injectable } from '@angular/core';
import { Selector } from '../classes/selector';
import { Observable, ReplaySubject } from 'rxjs';
import { Storage } from '@ionic/storage-angular';

@Injectable({
    providedIn: 'root',
})
export class SelectorService {
    readonly selectorsKey: string;
    private selectors: Selector[];
    private readonly _selectors: ReplaySubject<Selector[]>;

    private set selectors$(value: Selector[]) {
        this.selectors = value;
        this._selectors.next(value);
    }

    get selectors$(): Observable<Selector[]> {
        return this._selectors.asObservable();
    }

    constructor(private storage: Storage) {
        this.selectors = [];
        this.selectorsKey = 'selectors';
        this._selectors = new ReplaySubject<Selector[]>(1);
    }

    addSelectors(newSelectors: Selector[]) {
        this.selectors.push(...newSelectors);
        this.emitSelectors();
    }

    reset() {
        this.selectors = [];
        this.emitSelectors();
    }

    removeSelector(removedSelector: Selector) {
        const index = this.selectors.indexOf(removedSelector);
        this.selectors.splice(index, 1);
        this.emitSelectors();
    }

    patchSelectorName(selector: Selector, name: string) {
        const selectorToPatch = this.selectors.find((existingSelector) => existingSelector.equals(selector));
        if (!selectorToPatch) throw new Error('cannot change name of selector that is not in the list');
        selectorToPatch.patchName(name);
        this.storage.set(this.selectorsKey, this.selectors);
    }

    private emitSelectors() {
        this.selectors$ = this.selectors;
    }
}
