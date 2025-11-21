import { Selector } from './selector';
import { Round } from './round';
import { Observable, BehaviorSubject, Subscription, ReplaySubject } from 'rxjs';

const MIN_REMAINING_SELECTIONS = 3;

export interface DraftStateData {
    globalOrder: number;
    individualSelectorOrder: number;
    globalTurnNumber: number;
    individualSelectorTurnNumber: number;
    turnOrder: number;
    roundNumber: number;
    roundOrder: number;
    roundTurnNumber: number;
    roundsCount: number;
}

export class Draft {
    selectionsMade: number;
    readonly totalEntries: number;
    readonly availableSelections: number;
    readonly remainingSelections: number;
    private currentRoundIndex: number;
    private roundActiveSelectorSub!: Subscription;
    private activeSelector?: Selector;
    private readonly rounds: Round[];
    private readonly minRemainingSelections: number;
    private readonly _stateData: ReplaySubject<DraftStateData>;
    private readonly _activeSelector: ReplaySubject<Selector | undefined>;
    private readonly _draftComplete: BehaviorSubject<boolean>;

    get stateData$(): Observable<DraftStateData> {
        return this._stateData.asObservable();
    }

    get activeSelector$(): Observable<Selector | undefined> {
        return this._activeSelector.asObservable();
    }

    set activeSelector$(value: Selector | undefined) {
        this.activeSelector = value;
        this._activeSelector.next(value);
    }

    get draftComplete$(): Observable<boolean> {
        return this._draftComplete.asObservable();
    }

    private set draftComplete(complete: boolean) {
        this._draftComplete.next(complete);
    }

    private get currentRound(): Round {
        return this.rounds[this.currentRoundIndex];
    }

    private set currentRound(round: Round) {
        this.roundActiveSelectorSub?.unsubscribe();
        this.roundActiveSelectorSub = round.activeSelector$.subscribe((selector) => {
            this.activeSelector$ = selector;
        });
    }

    constructor(totalEntries: number, selectors: Selector[]) {
        this.minRemainingSelections = MIN_REMAINING_SELECTIONS;
        this.selectionsMade = 0;
        this.currentRoundIndex = 0;
        this.rounds = [];
        this.totalEntries = totalEntries;
        const totalSelectionsPerSelector = Math.floor((totalEntries - this.minRemainingSelections) / selectors.length);
        this.availableSelections = totalSelectionsPerSelector * selectors.length;
        this.remainingSelections = this.totalEntries - this.availableSelections;
        this.calculateRounds(totalSelectionsPerSelector, selectors);
        this._stateData = new ReplaySubject<DraftStateData>(1);
        this.emitStateData();
        this._activeSelector = new ReplaySubject<Selector | undefined>(1);
        this.currentRound = this.rounds[this.currentRoundIndex];
        this._draftComplete = new BehaviorSubject<boolean>(false);
    }

    private calculateRounds(remainingSelectionsPerSelector: number, selectors: Selector[]): void {
        let globalTurnOffset = 0;

        while (remainingSelectionsPerSelector > 0) {
            const selectionsPerTurn = Math.ceil(remainingSelectionsPerSelector / 2);
            this.rounds.push(new Round(selectionsPerTurn, selectors, globalTurnOffset, this.rounds.length % 2 === 1));
            selectors.forEach((selector) => selector.setRoundInfo(this.rounds.length, selectionsPerTurn));
            globalTurnOffset += selectors.length;
            remainingSelectionsPerSelector -= selectionsPerTurn;
        }
    }

    makeSelection(): void {
        if (this.isComplete()) return;
        this.selectionsMade++;
        this.currentRound.makeSelection(this.currentRoundIndex + 1);
        if (this.currentRound.isComplete()) this.advanceToNextRound();
        this.emitStateData();
    }

    undoSelection(): void {
        if (this.isEmpty()) return;
        if (this.currentRound.isEmpty()) {
            this.returnToPreviousRound();
        }
        if (this.isComplete()) {
            this.draftComplete = false;
            this.currentRound = this.rounds[this.currentRoundIndex];
        }
        this.selectionsMade--;
        this.currentRound.undoSelection(this.currentRoundIndex + 1);
        this.emitStateData();
    }

    isComplete(): boolean {
        const selectionsComplete = this.selectionsMade >= this.availableSelections;
        const isLastRound = this.currentRoundIndex === this.rounds.length - 1;
        const lastRoundComplete = this.currentRound.isComplete();
        return selectionsComplete && isLastRound && lastRoundComplete;
    }

    isEmpty(): boolean {
        const selectionsEmpty = this.selectionsMade <= 0;
        const isFristRound = this.currentRoundIndex <= 0;
        const firstRoundEmpty = this.currentRound.isEmpty();
        return selectionsEmpty && isFristRound && firstRoundEmpty;
    }

    advanceToNextRound(): void {
        if (this.isComplete()) {
            this.draftComplete = true;
            this.activeSelector$ = undefined;
            return;
        }
        if (!this.currentRound.isComplete()) return;
        this.currentRoundIndex++;
        this.currentRound = this.rounds[this.currentRoundIndex];
    }

    returnToPreviousRound(): void {
        if (this.isEmpty()) return;
        if (!this.currentRound.isEmpty()) return;
        this.currentRoundIndex--;
        this.currentRound = this.rounds[this.currentRoundIndex];
    }

    reset(): void {
        this.rounds.forEach((round) => round.reset());
        this.selectionsMade = 0;
        this.currentRoundIndex = 0;
        this.draftComplete = false;
        this.currentRound = this.rounds[this.currentRoundIndex];
        this.emitStateData();
    }

    private emitStateData() {
        this._stateData.next({
            globalOrder: this.selectionsMade,
            individualSelectorOrder: this.activeSelector ? this.activeSelector.currentOrder : 0,
            globalTurnNumber:
                this.currentRoundIndex * this.currentRound.turns.length + this.currentRound.currentTurnIndex + 1,
            individualSelectorTurnNumber: this.currentRoundIndex + 1,
            turnOrder: this.currentRound.currentTurn.selectionsMade,
            roundNumber: this.currentRoundIndex + 1,
            roundOrder: this.currentRound.selectionsMade,
            roundTurnNumber: this.currentRound.currentTurnIndex + 1,
            roundsCount: this.rounds.length,
        });
    }
}
