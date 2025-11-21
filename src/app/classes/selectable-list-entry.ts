import { DraftStateData } from './draft';
import { ListEntry } from './list-entry';
import { Selector } from './selector';

export class SelectableListEntry extends ListEntry {
    selected: boolean;
    selector?: Selector;
    globalOrder?: number;
    individualSelectorOrder?: number;
    globalTurnNumber?: number;
    individualSelectorTurnNumber?: number;
    turnOrder?: number;
    roundNumber?: number;
    roundOrder?: number;
    roundTurnNumber?: number;

    constructor(listEntry: ListEntry) {
        super(listEntry);
        this.selected = false;
    }

    select(selector: Selector) {
        this.selected = true;
        this.selector = selector;
    }

    setSelectionStateData(args?: DraftStateData) {
        if (!args) {
            delete this.globalOrder;
            delete this.individualSelectorOrder;
            delete this.globalTurnNumber;
            delete this.individualSelectorTurnNumber;
            delete this.turnOrder;
            delete this.roundNumber;
            delete this.roundOrder;
            delete this.roundTurnNumber;
            return;
        }
        this.globalOrder = args.globalOrder;
        this.individualSelectorOrder = args.individualSelectorOrder;
        this.globalTurnNumber = args.globalTurnNumber;
        this.individualSelectorTurnNumber = args.individualSelectorTurnNumber;
        this.turnOrder = args.turnOrder;
        this.roundNumber = args.roundNumber;
        this.roundOrder = args.roundOrder;
        this.roundTurnNumber = args.roundTurnNumber;
    }

    deselect() {
        if (!this.selector) return;
        this.selected = false;
        delete this.selector;
        this.setSelectionStateData();
    }

    copy(): SelectableListEntry {
        return { ...this };
    }
}
