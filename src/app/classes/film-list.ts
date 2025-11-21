import { SelectableListEntry } from './selectable-list-entry';
import { Selector } from './selector';

export class FilmList {
    readonly availableEntries: number;
    readonly entries: SelectableListEntry[];
    currentOrder: number;

    constructor(entries: SelectableListEntry[]) {
        this.entries = entries;
        this.currentOrder = 0;
        this.availableEntries = this.entries.filter((entry) => !entry.disabled).length;
    }

    reset() {
        this.entries
            .filter((entry) => entry.selected)
            .forEach((entry) => {
                this.deselectEntry(entry);
            });
    }

    selectEntry(entry: SelectableListEntry, selector: Selector) {
        if (entry.selected || entry.disabled) return;
        this.currentOrder += 1;
        entry.select(selector);
    }

    deselectEntry(entry: SelectableListEntry) {
        if (!entry.selected || entry.disabled) return;
        entry.deselect();
        this.currentOrder += -1;
    }
}
