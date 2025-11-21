import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { Observable, ReplaySubject, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { FilmList } from '../classes/film-list';
import { IListEntry, ListEntry } from '../classes/list-entry';
import { SelectableListEntry } from '../classes/selectable-list-entry';
import { Storage } from '@ionic/storage-angular';
import { AuthService } from '../../app/auth/services/auth.service';

/*
################################################################################
###                                   DOCS                                   ###
################################################################################

FilmListService
------------------
Angular service that manages film list retrieval and state persistence. Accepts
Letterboxd list URLs from users, verifies them via AuthService, fetches film
entries from the backend, and maintains the film list as an observable. Parses
and normalizes URLs to conform to a standard Letterboxd detail path format.
Caches the last valid URL in Ionic storage and broadcasts loading and error
states to subscribers.

Configuration:
    - Uses environment.backendUrl + '/list' endpoint to fetch film entries.
    - Relies on AuthService.verifyURL() for URL validation before fetching.
    - Stores last valid URL in Ionic Storage under 'last-valid-url' key.
    - Expects Letterboxd URLs in format: https://letterboxd.com/[username]/list/[listtitle]/
    - Uses ToastController to display error messages to the user.

Classes:
    FilmListDetailUrl
        - Parses and normalizes Letterboxd list URLs.
        - Extracts username and list title from URL path.
        - Provides toString() for detail view URL and toGridUrl() for grid view URL.

    FilmListDetailPath
        - Represents the URL path structure: /[username]/list/[listtitle]/detail/
        - Provides toString() for detail path and toGridPath() for grid path.

    FilmListService (@Injectable)
        - Manages film list observable state via ReplaySubjects.
        - Handles URL input validation, film list fetching, and error handling.
        - Persists and restores last valid URL via Ionic Storage.

Functions:
    isValidUrl:
        Validates a URL string by attempting to instantiate FilmListDetailUrl.
        - Returns true if URL parses successfully, false otherwise.
        - Returns false if urlString is empty or throws an error.

    inputUrl (setter):
        Accepts a URL string and broadcasts it via _inputUrl ReplaySubject.
        - Triggers URL verification and film list fetching via internal subscription.

    lastValidUrl$ (setter):
        Sets the last valid URL, broadcasts via _lastValidUrl ReplaySubject,
        and updates the internal lastValidUrl property.

    filmList$ (setter):
        Broadcasts a FilmList object via _filmList ReplaySubject.

    isLoading (setter):
        Sets loading state and broadcasts via _isLoading ReplaySubject.

    getFilmList (private):
        Fetches film entries from backend using the provided FilmListDetailUrl.
        - Sets isLoading to true, makes HTTP GET request with URL as query param.
        - Transforms IListEntry[] into FilmList with SelectableListEntry objects.
        - On success: broadcasts filmList, updates lastValidUrl, saves state, sets isLoading false.
        - On error: calls handleError to display toast and clear loading state.

    handleError (private):
        Displays error toast with error message or generic fallback text.
        - Logs error to console, presents toast for 3 seconds, broadcasts _error event.
        - Sets isLoading to false to clear loading indicator.

    saveState (private):
        Persists lastValidUrl as string to Ionic Storage under lastValidUrlKey.

    getSavedState (private, async):
        Retrieves lastValidUrl string from Ionic Storage and restores it as URL object.

    Observables:
        inputUrl: Observable<string> - User-provided list URL input.
        lastValidUrl$: Observable<URL> - Last successfully verified and fetched list URL.
        filmList$: Observable<FilmList> - Current film list with selectable entries.
        isLoading: Observable<boolean> - Loading state during URL verification and film fetch.
        error: Observable<void> - Error event emitted on failed operations.

*/

class FilmListDetailUrl {
    private readonly domain = 'letterboxd.com';
    private readonly prefixes = ['https://', 'https://www.', '', 'www.', 'http://', 'http://www.'];
    private readonly detailPath: FilmListDetailPath;
    private readonly url: URL;

    constructor(url: string) {
        const splitUrl = url.split(this.domain);
        this.detailPath = new FilmListDetailPath(splitUrl[1]);
        this.url = new URL(`${this.prefixes[0]}${this.domain}${this.detailPath.toString()}`);
    }

    toString(): string {
        return this.url.toString();
    }

    toGridUrl(): URL {
        return new URL(`${this.prefixes[0]}${this.domain}${this.detailPath.toGridPath()}`);
    }
}

class FilmListDetailPath {
    private readonly separator = '/';
    private readonly prefix = 'list';
    private readonly suffix = 'detail';
    private readonly username: string;
    private readonly listTitle: string;

    constructor(path: string) {
        const splitPath = path.split(this.separator);
        this.username = splitPath[1];
        this.listTitle = splitPath[3];
    }

    toString(): string {
        const parts = ['', this.username, this.prefix, this.listTitle, this.suffix, ''];
        return parts.join(this.separator);
    }

    toGridPath(): string {
        const parts = ['', this.username, this.prefix, this.listTitle, ''];
        return parts.join(this.separator);
    }
}

export function isValidUrl(urlString: string): boolean {
    if (!urlString) return false;
    try {
        const validUrl = new FilmListDetailUrl(urlString);
        return !!validUrl;
    } catch (error) {
        return false;
    }
}

@Injectable({
    providedIn: 'root',
})
export class FilmListService {
    private readonly lastValidUrlKey: string;
    private readonly getListUrl: string;

    private lastValidUrl?: URL;
    private readonly _lastValidUrl: ReplaySubject<URL>;
    private readonly _filmList: ReplaySubject<FilmList>;

    private readonly _inputUrl: ReplaySubject<string>;
    private readonly _isLoading: ReplaySubject<boolean>;
    private readonly _error: ReplaySubject<void>;

    get inputUrl(): Observable<string> {
        return this._inputUrl.asObservable();
    }

    set inputUrl(value: string) {
        this._inputUrl.next(value);
    }

    get lastValidUrl$(): Observable<URL> {
        return this._lastValidUrl.asObservable();
    }

    private set lastValidUrl$(value: URL) {
        this.lastValidUrl = value;
        this._lastValidUrl.next(value);
    }

    get filmList$(): Observable<FilmList> {
        return this._filmList.asObservable();
    }

    set filmList$(value: FilmList) {
        this._filmList.next(value);
    }

    get isLoading(): Observable<boolean> {
        return this._isLoading.asObservable();
    }

    private set isLoading(value: boolean) {
        this._isLoading.next(value);
    }

    get error(): Observable<void> {
        return this._error.asObservable();
    }

    constructor(
        private http: HttpClient,
        private toast: ToastController,
        private storage: Storage,
        private readonly auth: AuthService,
    ) {
        this.lastValidUrlKey = 'last-valid-url';
        this.getListUrl = `${environment.backendUrl}/list`;

        this._lastValidUrl = new ReplaySubject<URL>(1);
        this._filmList = new ReplaySubject<FilmList>(1);

        this._inputUrl = new ReplaySubject<string>(1);
        this._isLoading = new ReplaySubject<boolean>(1);
        this._error = new ReplaySubject<void>(1);

        this.getSavedState();

        this.inputUrl
            .pipe(
                map((url) => {
                    return this.auth.verifyURL(url);
                }),
            )
            .subscribe({
                next: (url) => {
                    url.subscribe({
                        next: (verifiedUrl) => {
                            let detailUrl = new FilmListDetailUrl(verifiedUrl.url);
                            this.getFilmList(detailUrl);
                        },
                        error: (error) => {
                            this.isLoading = false;
                            window.alert('URL not valid, try again');
                        },
                    });
                },
            });
    }

    private getFilmList(listUrl: FilmListDetailUrl) {
        this.isLoading = true;
        const url = new URL(this.getListUrl);
        url.searchParams.set('url', listUrl.toString());
        this.http
            .get<IListEntry[]>(url.toString())
            .pipe(
                map((entries) => {
                    entries = entries.map((entry) => {
                        return new ListEntry({
                            position: entry.position,
                            title: entry.title,
                            year: entry.year,
                            urlSlug: entry.urlSlug,
                            posterUrl: entry.posterUrl,
                            suggestedBy: entry.note,
                            disabled: entry.disabled,
                        });
                    });
                    return new FilmList(
                        entries.map((entry) => {
                            return new SelectableListEntry(entry);
                        }),
                    );
                }),
            )
            .subscribe({
                next: (filmList) => {
                    this.filmList$ = filmList;
                    this.isLoading = false;
                    this.lastValidUrl$ = listUrl.toGridUrl();
                    this.saveState();
                },
                error: (error) => {
                    this.handleError(error);
                },
            });
    }

    private handleError(error: any) {
        console.error(error);
        this.toast
            .create({
                message: error.error.message ?? 'Unexpected error, list could not be retrieved',
                color: 'danger',
                duration: 3000,
                position: 'top',
                icon: 'alert-circle',
                swipeGesture: 'vertical',
                buttons: [
                    {
                        icon: 'close',
                        side: 'end',
                        role: 'cancel',
                    },
                ],
            })
            .then((toast) => toast.present());
        this.isLoading = false;
        this._error.next();
    }

    private saveState() {
        if (!this.lastValidUrl) return;
        this.storage.set(this.lastValidUrlKey, this.lastValidUrl.toString());
    }

    private async getSavedState() {
        const lastValidUrl: string | null = await this.storage.get(this.lastValidUrlKey);
        if (lastValidUrl) this.lastValidUrl$ = new URL(lastValidUrl);
    }
}
