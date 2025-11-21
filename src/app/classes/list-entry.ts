export class ListEntry {
    readonly position: number;
    readonly title: string;
    readonly year: string;
    readonly urlSlug: string;
    readonly posterUrl: string;
    readonly suggestedBy?: string;
    readonly disabled?: boolean;

    constructor(args: {
        position: number;
        title: string;
        year: string;
        urlSlug: string;
        posterUrl: string;
        suggestedBy?: string;
        disabled?: boolean;
    }) {
        this.position = args.position;
        this.title = args.title;
        this.year = args.year;
        this.urlSlug = args.urlSlug;
        this.posterUrl = args.posterUrl;
        this.disabled = args.disabled;
        this.suggestedBy = args.suggestedBy;
    }
}

export interface IListEntry {
    readonly position: number;
    readonly title: string;
    readonly year: string;
    readonly urlSlug: string;
    readonly posterUrl: string;
    readonly note?: string;
    readonly disabled?: boolean;
}
