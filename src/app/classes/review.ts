import { ListEntry } from './list-entry';
import { Person } from './selector';

export class Reviewer implements Person {
    readonly color: string;
    readonly contrast: string;
    readonly name: string;
    score?: number;

    constructor(person: Person) {
        this.name = person.name;
        this.color = person.color;
        this.contrast = person.contrast;
    }

    setScore(score: number): void {
        this.score = score;
    }

    unsetScore(): number | undefined {
        const previousScore = this.score;
        delete this.score;
        return previousScore;
    }
}

class ScoreBuilder {
    private readonly inputScores: number[];
    private readonly targetScoresCount: number;

    constructor(targetScoresCount: number) {
        this.inputScores = [];
        this.targetScoresCount = targetScoresCount;
    }

    addOrReplaceScore(input: number, currentScore?: number): { valid: boolean } {
        const isValid = this.validateInput(input);
        if (!isValid) return { valid: false };
        const indexToRemove = this.inputScores.findIndex((score) => score === currentScore);
        if (indexToRemove < 0) {
            this.inputScores.push(input);
        } else {
            this.inputScores.splice(indexToRemove, 1, input);
        }
        return { valid: true };
    }

    removeScore(input: number): void {
        const indexToRemove = this.inputScores.findIndex((score) => score === input);
        if (indexToRemove < 0) return;
        this.inputScores.splice(indexToRemove, 1);
    }

    result(): number {
        console.table(this.inputScores);
        console.debug('divisor', this.targetScoresCount);
        if (this.inputScores.length < this.targetScoresCount) {
            throw new Error('Calling result without all scores set!');
        } else if (this.inputScores.length > this.targetScoresCount) {
            throw new Error('Calling result with more scores than allowed!');
        }
        const accumulated = this.inputScores.reduce((prev, curr) => (prev += curr), 0);
        console.debug('accumulated', accumulated);
        const average = accumulated / this.targetScoresCount;
        console.debug('average', average);
        const rounded = Math.floor(average * 2) / 2;
        console.debug('rounded', rounded);
        return rounded;
    }

    private validateInput(input: number): boolean {
        if (input < 0) return false;
        if (input > 5) return false;
        return true;
    }
}

export class Review {
    readonly film: ListEntry;
    readonly reviewers: Reviewer[];
    readonly scoreBuilder: ScoreBuilder;

    constructor(film: ListEntry, people: Person[]) {
        this.film = film;
        this.reviewers = people.map((person) => new Reviewer(person));
        this.scoreBuilder = new ScoreBuilder(this.reviewers.length);
    }

    addOrReplaceScore(person: Person, score: number): void {
        const reviewer = this.reviewers.find((reviewer) => person.color === reviewer.color);
        if (!reviewer) return;
        const currentScore = reviewer.score;
        const { valid } = this.scoreBuilder.addOrReplaceScore(score, currentScore);
        if (!valid) return;
        reviewer.setScore(score);
    }

    removeScore(person: Person): void {
        const reviewer = this.reviewers.find((reviewer) => person.color === reviewer.color);
        if (!reviewer) return;
        const removedScore = reviewer.unsetScore();
        if (removedScore === undefined) return;
        this.scoreBuilder.removeScore(removedScore);
    }

    finish(): number {
        return this.scoreBuilder.result();
    }
}
