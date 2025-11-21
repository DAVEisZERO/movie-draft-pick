import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, ReplaySubject } from 'rxjs';
import { SelectableListEntry } from '../classes/selectable-list-entry';
import { environment } from '../../environments/environment';

interface TmdbMovieDetails {
    overview: string;
    genres: { id: number; name: string }[];
    budget: number;
    revenue: number;
    runtime: number;
    tagline: string;
    vote_average: number;
    original_title: string;
    origin_country: string[];
}

interface TmdbMovieCredits {
    cast: { name: string; order: number }[];
    crew: { name: string; job: string }[];
}

interface TmdbMovieTranslations {
    translations: { iso_3166_1: string; english_name: string; data: { title: string } }[];
}

export class InfoPanelFilmEntry extends SelectableListEntry {
    averageRating?: number;
    ratingString?: number;
    budget?: number;
    tagline?: string;
    summary?: string;
    revenue?: number;
    durationInMinutes?: number;
    durationString?: string;
    genres?: { id: number; name: string }[];
    genreString?: string;
    directorsString?: string;
    soundtrackString?: string;
    leadRolesString?: string;
    translations?: { country: string; title: string }[];
    originalTitle?: string;
    originCountry?: string;
    highResPosterUrl: string;

    constructor(entry: SelectableListEntry) {
        super(entry);
        Object.assign(this, entry);
        this.highResPosterUrl = this.getHighResPosterUrl(entry);
    }

    private getHighResPosterUrl(entry: SelectableListEntry): string {
        const lowResUrl = new URL(entry.posterUrl);
        const highResPath = new HighResPosterPath(lowResUrl.pathname);
        return lowResUrl.protocol + '//' + lowResUrl.host + highResPath.toString();
    }

    addDetails(details: TmdbMovieDetails) {
        this.averageRating = details.vote_average;
        this.ratingString = this.averageRating / 2;
        this.budget = details.budget;
        this.tagline = details.tagline;
        this.summary = details.overview;
        this.revenue = details.revenue;
        this.durationInMinutes = details.runtime;
        const totalHours = Math.floor(this.durationInMinutes / 60);
        const remainingMinutes = this.durationInMinutes % 60;
        this.durationString = `${totalHours}h ${remainingMinutes}m`;
        this.genres = details.genres;
        this.genreString = this.genres.map((genre) => genre.name).join(' | ');
        this.originalTitle = details.original_title === this.title ? undefined : details.original_title;
        this.originCountry = details.origin_country.join(' | ');
    }

    addCredits(credits: TmdbMovieCredits) {
        const directorJob = 'Director';
        const soundtrackJob = 'Original Music Composer';
        const leadRoleOrders = [0, 1, 2];
        const directors = credits.crew.filter((crew) => crew.job === directorJob);
        if (directors) this.directorsString = directors.map((director) => director.name).join(' | ');
        const soundtrack = credits.crew.filter((crew) => crew.job === soundtrackJob);
        if (soundtrack) this.soundtrackString = soundtrack.map((composer) => composer.name).join(' | ');
        const leadRoles = credits.cast.filter((cast) => leadRoleOrders.includes(cast.order));
        if (leadRoles) this.leadRolesString = leadRoles.map((leadRole) => leadRole.name).join(' | ');
    }

    addTranslations(translations: TmdbMovieTranslations) {
        const spanishName = 'Spanish';
        const spanishTranslations = translations.translations
            .filter((translation) => translation.english_name === spanishName)
            .filter((translation) => Boolean(translation.data.title));
        this.translations = spanishTranslations.map((translation) => {
            return { country: translation.iso_3166_1, title: translation.data.title };
        });
    }
}

class HighResPosterPath {
    readonly separator = '-0-';
    readonly suffix = '-crop';
    readonly extension = '.jpg';
    readonly posterWidth = '1000';
    readonly posterHeight = '1500';
    posterPath: string;

    constructor(pathname: string) {
        const splitPath = pathname.split(this.separator);
        if (splitPath.length < 1) throw new Error('found empty poster path');
        if (!splitPath[splitPath.length - 1].includes(this.suffix)) {
            throw new Error(`expected poster filename to include a suffix: "${pathname}"`);
        }
        if (!splitPath[splitPath.length - 1].includes(this.extension)) {
            throw new Error(`expected poster file extension to be .jpg: "${pathname}"`);
        }
        const pathParts: string[] = [];
        splitPath.forEach((path, index, array) => {
            if (index >= array.length - 2) return;
            pathParts.push(path);
        });
        this.posterPath = pathParts.join(this.separator);
    }

    toString(): string {
        const parts = [this.posterPath, this.posterWidth, this.posterHeight];
        return `${parts.join(this.separator)}${this.suffix}${this.extension}`;
    }
}

@Injectable({
    providedIn: 'root',
})
export class InfoPanelService {
    private readonly tmdbToken: string;
    private readonly headers: HttpHeaders;
    private readonly _currentFilm: ReplaySubject<InfoPanelFilmEntry | undefined>;
    private readonly filmCache: InfoPanelFilmEntry[];

    get currentFilm$(): Observable<InfoPanelFilmEntry | undefined> {
        return this._currentFilm.asObservable();
    }

    private set currentFilm$(value: InfoPanelFilmEntry | undefined) {
        this._currentFilm.next(value);
    }

    constructor(private readonly http: HttpClient) {
        this._currentFilm = new ReplaySubject<InfoPanelFilmEntry | undefined>(1);
        this.filmCache = [];
        this.tmdbToken = environment.tmdbToken;
        this.headers = new HttpHeaders();
        this.headers = this.headers.append('Authorization', `Bearer ${this.tmdbToken}`);
    }

    getInfoFor(entry: SelectableListEntry) {
        const cachedFilm = this.getFromCache(entry);
        if (cachedFilm) {
            Object.assign(cachedFilm, entry);
            this.currentFilm$ = cachedFilm;
            return;
        }
        this.getTmdbMovieId(entry).subscribe({
            next: (id: string) => {
                const newFilm = new InfoPanelFilmEntry(entry);
                const observables = [
                    this.getMovieDetails(newFilm, id),
                    this.getMovieCredits(newFilm, id),
                    this.getMovieTranslations(newFilm, id),
                ];
                forkJoin(observables).subscribe({
                    next: () => {
                        this.currentFilm$ = newFilm;
                        this.filmCache.push(newFilm);
                    },
                });
            },
        });
    }

    clearPanel() {
        this.currentFilm$ = undefined;
    }

    private getTmdbMovieId(entry: SelectableListEntry): Observable<string> {
        const searchUrl = new URL(`https://api.themoviedb.org/3/search/movie`);
        searchUrl.searchParams.append('query', entry.title);
        searchUrl.searchParams.append('year', entry.year);
        searchUrl.searchParams.append('include_adult', 'false');
        return this.http.get<{ results: { id: number }[] }>(searchUrl.toString(), { headers: this.headers }).pipe(
            map((response) => {
                return response.results[0].id.toString();
            }),
        );
    }

    private getMovieDetails(entry: InfoPanelFilmEntry, id: string): Observable<void> {
        const detailUrl = new URL(`https://api.themoviedb.org/3/movie/${id}`);
        return this.http.get<TmdbMovieDetails>(detailUrl.toString(), { headers: this.headers }).pipe(
            map((response) => {
                entry.addDetails({
                    vote_average: response.vote_average,
                    budget: response.budget,
                    tagline: response.tagline,
                    overview: response.overview,
                    revenue: response.revenue,
                    runtime: response.runtime,
                    genres: response.genres,
                    original_title: response.original_title,
                    origin_country: response.origin_country,
                });
            }),
        );
    }

    private getMovieCredits(entry: InfoPanelFilmEntry, id: string): Observable<void> {
        const detailUrl = new URL(`https://api.themoviedb.org/3/movie/${id}/credits`);
        return this.http.get<TmdbMovieCredits>(detailUrl.toString(), { headers: this.headers }).pipe(
            map((response) => {
                entry.addCredits({ cast: response.cast, crew: response.crew });
            }),
        );
    }

    private getMovieTranslations(entry: InfoPanelFilmEntry, id: string): Observable<void> {
        const detailUrl = new URL(`https://api.themoviedb.org/3/movie/${id}/translations`);
        return this.http.get<TmdbMovieTranslations>(detailUrl.toString(), { headers: this.headers }).pipe(
            map((response) => {
                entry.addTranslations({ translations: response.translations });
            }),
        );
    }

    private getFromCache(entry: SelectableListEntry): InfoPanelFilmEntry | undefined {
        return this.filmCache.find((film) => entry.title === film.title && entry.year === film.year);
    }
}
