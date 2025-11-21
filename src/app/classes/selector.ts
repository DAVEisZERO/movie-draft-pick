export class Selector implements Person {
    readonly color: string;
    readonly contrast: string;
    name: string;
    currentOrder: number;
    selectionsPerRound: Map<number, number>;
    totalSelectionsPerRound: Map<number, number>;

    constructor(person: Person) {
        this.name = person.name;
        this.color = person.color;
        this.contrast = person.contrast;
        this.currentOrder = 0;
        this.selectionsPerRound = new Map();
        this.totalSelectionsPerRound = new Map();
    }

    equals(selector?: Selector): boolean {
        if (!selector) return false;
        return this.color.toLowerCase() === selector.color.toLowerCase();
    }

    patchName(newName: string) {
        this.name = newName;
    }

    makeSelection(currentRound: number) {
        const previousNumber = this.selectionsPerRound.get(currentRound);
        if (previousNumber === undefined) {
            throw Error(`Round ${currentRound} not found for selector`);
        }
        this.currentOrder += 1;
        this.selectionsPerRound.set(currentRound, previousNumber + 1);
    }

    undoSelection(currentRound: number) {
        const previousNumber = this.selectionsPerRound.get(currentRound);
        if (previousNumber === undefined) {
            throw Error(`Round ${currentRound} not found for selector`);
        }
        this.currentOrder += -1;
        this.selectionsPerRound.set(currentRound, previousNumber - 1);
    }

    setRoundInfo(roundNumber: number, selectionsPerRound: number) {
        this.selectionsPerRound.set(roundNumber, 0);
        this.totalSelectionsPerRound.set(roundNumber, selectionsPerRound);
    }

    resetCountInfo(roundNumber: number) {
        this.currentOrder = 0;
        this.selectionsPerRound.set(roundNumber, 0);
    }

    getSelectionsMadeForRound(currentRound: number): number {
        const selectionsPerRound = this.selectionsPerRound.get(currentRound);
        if (selectionsPerRound === undefined) {
            throw Error(`Round ${currentRound} not found for selector`);
        }
        return selectionsPerRound;
    }

    getTotalSelectionsForRound(currentRound: number): number {
        const totalSelectionsPerRound = this.totalSelectionsPerRound.get(currentRound);
        if (totalSelectionsPerRound === undefined) {
            throw Error(`Round ${currentRound} not found for selector`);
        }
        return totalSelectionsPerRound;
    }
}

export interface Person {
    readonly color: string;
    readonly contrast: string;
    name: string;
}
