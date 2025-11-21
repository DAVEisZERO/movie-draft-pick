import { Selector } from './selector';

export class Turn {
    readonly selector: Selector;
    selectionsMade: number;
    private readonly selectionsPerTurn: number;
    private readonly globalTurnNumber: number;
    private readonly roundTurnNumber: number;

    constructor(selector: Selector, selectionsPerTurn: number, globalTurnNumber: number, roundTurnNumber: number) {
        this.selector = selector;
        this.selectionsMade = 0;
        this.selectionsPerTurn = selectionsPerTurn;
        this.globalTurnNumber = globalTurnNumber;
        this.roundTurnNumber = roundTurnNumber;
    }

    makeSelection(currentRound: number): void {
        if (this.isComplete()) return;
        this.selectionsMade++;
        this.selector.makeSelection(currentRound);
    }

    undoSelection(currentRound: number): void {
        if (this.isEmpty()) return;
        this.selectionsMade--;
        this.selector.undoSelection(currentRound);
    }

    isComplete(): boolean {
        return this.selectionsMade >= this.selectionsPerTurn;
    }

    isEmpty(): boolean {
        return this.selectionsMade <= 0;
    }

    getTurnNumbers() {
        return {
            global: this.globalTurnNumber,
            round: this.roundTurnNumber,
        };
    }

    reset(): void {
        this.selectionsMade = 0;
    }
}
