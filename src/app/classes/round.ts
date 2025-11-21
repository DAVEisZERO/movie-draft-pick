import { BehaviorSubject, Observable } from 'rxjs';
import { Selector } from './selector';
import { Turn } from './turn';

export class Round {
    readonly selectionsPerRound: number;
    selectionsMade: number;
    currentTurnIndex: number;
    readonly turns: Turn[];
    private readonly _currentTurn: BehaviorSubject<Turn>;
    private readonly _activeSelector: BehaviorSubject<Selector>;

    get activeSelector$(): Observable<Selector> {
        return this._activeSelector.asObservable();
    }

    get currentTurn(): Turn {
        return this.turns[this.currentTurnIndex];
    }

    private set currentTurn(turn: Turn) {
        this._currentTurn.next(turn);
        this._activeSelector.next(turn.selector);
    }

    constructor(selectionsPerTurn: number, selectors: Selector[], globalTurnOffset: number, reverseOrder: boolean) {
        this.selectionsMade = 0;
        this.currentTurnIndex = 0;
        this.turns = [];
        this.selectionsPerRound = selectionsPerTurn * selectors.length;
        this.calculateTurns(selectionsPerTurn, selectors, globalTurnOffset, reverseOrder);
        this._currentTurn = new BehaviorSubject<Turn>(this.turns[this.currentTurnIndex]);
        this._activeSelector = new BehaviorSubject<Selector>(this.currentTurn.selector);
    }

    private calculateTurns(
        selectionsPerTurn: number,
        selectors: Selector[],
        globalTurnOffset: number,
        reverseOrder: boolean,
    ): void {
        const orderedSelectors = reverseOrder ? [...selectors].reverse() : selectors;
        orderedSelectors.forEach((selector, index) => {
            const globalTurnNumber = globalTurnOffset + index + 1;
            const roundTurnNumber = index + 1;
            this.turns.push(new Turn(selector, selectionsPerTurn, globalTurnNumber, roundTurnNumber));
        });
    }

    makeSelection(currentRound: number): void {
        if (this.isComplete()) return;
        this.selectionsMade++;
        this.currentTurn.makeSelection(currentRound);
        if (this.currentTurn.isComplete()) this.advanceToNextTurn();
    }

    undoSelection(currentRound: number): void {
        if (this.isEmpty()) return;
        if (this.currentTurn.isEmpty()) {
            this.returnToPreviousTurn();
        }
        this.selectionsMade--;
        this.currentTurn.undoSelection(currentRound);
    }

    isComplete(): boolean {
        const selectionsComplete = this.selectionsMade >= this.selectionsPerRound;
        const isLastTurn = this.currentTurnIndex === this.turns.length - 1;
        const lastTurnComplete = this.currentTurn.isComplete();
        return selectionsComplete && isLastTurn && lastTurnComplete;
    }

    isEmpty(): boolean {
        const selectionsEmpty = this.selectionsMade <= 0;
        const isFirstTurn = this.currentTurnIndex <= 0;
        const firstTurnEmpty = this.currentTurn.isEmpty();
        return selectionsEmpty && isFirstTurn && firstTurnEmpty;
    }

    advanceToNextTurn(): void {
        if (this.isComplete()) return;
        if (!this.currentTurn.isComplete()) return;
        this.currentTurnIndex++;
        this.currentTurn = this.turns[this.currentTurnIndex];
    }

    returnToPreviousTurn(): void {
        if (this.isEmpty()) return;
        if (!this.currentTurn.isEmpty()) return;
        this.currentTurnIndex--;
        this.currentTurn = this.turns[this.currentTurnIndex];
    }

    reset(): void {
        this.selectionsMade = 0;
        this.currentTurnIndex = 0;
        this.turns.forEach((turn) => {
            turn.reset();
            turn.selector.resetCountInfo(this.currentTurnIndex + 1);
        });
        this.currentTurn = this.turns[this.currentTurnIndex];
    }
}
