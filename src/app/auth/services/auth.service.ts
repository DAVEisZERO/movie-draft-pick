import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthenticatedUser, UserSession, StatusRequest, VerifiedUrl } from '../interfaces/validated-auth-user.dto';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, ReplaySubject, tap, throwError, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

/*
################################################################################
###                                   DOCS                                   ###
################################################################################

AuthService
------------------
Manages authentication state for the application. Provides login, signup, logout,
profile update, password reset and URL verification functions. Persists session
and user data in sessionStorage (primary) and localStorage (NOT-secure, optional).
Parses OAuth-style token fragments from the URL and broadcasts session updates
via RxJS subjects/observables.

Configuration:
    Relies on environment.iam configuration values:
      - loginUrl, signupUrl, deleteAccountUrl, changeNameUrl, changePasswordUrl,
        verifyListUrl, passwordResetUrl
    Also uses environment.home for logout redirect.
    Note: client_id / client_secret are currently hard-coded for password grant use.

Classes:
    AuthService
        Angular @Injectable({ providedIn: 'root' }) service that:
          - Holds authState BehaviorSubject<UserSession | null>
          - Exposes observables for current user and token
          - Interacts with HttpClient to call IAM endpoints
          - Persists session/user to sessionStorage and optionally to localStorage

Functions:
    checkUrlForToken: Detects and parses an access token and user info from the URL fragment.
        - Builds a UserSession from fragment params, cleans the URL, and broadcasts session.

    onAuthStateChange: Subscribes a callback to authState$ to receive session updates.
        - Accepts (session: UserSession | null) => void

    saveToSessionStorage: Stores raw token string under 'sessionData' in sessionStorage.

    saveToUserStorage: Stores user object as JSON under 'userData' in sessionStorage.

    loadSessionFromSessionStorage: Reads 'sessionData' from sessionStorage and returns it.

    laodUserFromSessionStorage: Reads and parses 'userData' from sessionStorage (returns AuthenticatedUser | null).

    getCurrentUser: Returns Observable<AuthenticatedUser | null> of the current user ReplaySubject.

    getCurrentToken: Returns Observable<string | null> of the current token ReplaySubject.

    signUp: Calls IAM signupUrl to register a new user.
        - POST JSON { name, email, password }

    login: Sends a password-grant request to loginUrl and broadcasts session on success.
        - Uses application/x-www-form-urlencoded body with grant_type=password

    deleteAccount: Posts current user info to deleteAccountUrl with Authorization header.

    logout: Removes session and user from storage, clears subjects, and redirects to environment.home.

    sendPasswordReset: Calls passwordResetUrl to request a password reset email.
        - Returns Observable<void>, logs success, and propagates errors.

    updateDisplayName: Calls changeNameUrl to update the current user's display name and broadcasts session.

    updatePassword: Calls changePasswordUrl to update the current user's password and broadcasts session.

    verifyURL: Posts a URL to verifyListUrl and returns VerifiedUrl response.

    saveToLocalStorage [INSECURE]: Stores token in localStorage (not secure; for non-sensitive data only).

    saveUserToLocalStorage [INSECURE]: Stores user as JSON in localStorage (not secure).

    loadLocalFromLocalStorage [INSECURE]: Reads 'sessionData' from localStorage.

    laodUserFromLocalStorage [INSECURE]: Reads and parses 'userData' from localStorage (returns AuthenticatedUser | null).

*/

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    //Auth state management
    private authState = new BehaviorSubject<UserSession | null>(null);
    authState$: Observable<UserSession | null> = this.authState.asObservable();

    // Current user and token management
    private readonly activetUser: ReplaySubject<AuthenticatedUser | null> = new ReplaySubject<AuthenticatedUser | null>(
        1,
    );
    private readonly activeToken: ReplaySubject<string | null> = new ReplaySubject<string | null>(1);

    constructor(
        private readonly http: HttpClient,
        private readonly router: Router,
    ) {
        // Look for existing session in session storage
        // If found, push it into the authState subject
        ///////////////
        if (this.laodUserFromSessionStorage()) {
            this.authState.next({
                access_token: this.loadSessionFromSessionStorage()!,
                token_type: 'bearer',
                user: this.laodUserFromSessionStorage(),
            } as UserSession);
        }
        ///////////////
        this.checkUrlForToken();

        //////////////////////////////////////////////////////////////////////////////////////////////
        if (!environment.iam.loginUrl) {
            throw new Error('Auth configuration not provided');
        }

        // Hnadle auth state changes
        this.onAuthStateChange((session) => {
            if (session) {
                const authUser = session.user as AuthenticatedUser;
                this.activetUser.next(authUser);
                this.activeToken.next(session.access_token);
                this.saveToSessionStorage(session.access_token);
                this.saveToUserStorage(authUser);
            } else {
                this.activetUser.next(null);
                this.activeToken.next(null);
            }
        });
    }

    // NEW ///////////////////////////////////////
    public checkUrlForToken(): void {
        const fragment = window.location.hash;

        if (fragment.length > 1) {
            // Check if there's a fragment
            // Parse the fragment string (e.g., "#access_token=...&...")
            const params = new URLSearchParams(fragment.substring(1)); // Remove the '#'
            const accessToken = params.get('access_token');
            const user_info = params.get('user'); // Assuming user info is also passed

            if (accessToken) {
                // 4. TOKEN FOUND!
                const session: UserSession = {
                    access_token: accessToken,
                    token_type: params.get('token_type') || 'bearer',
                    expires_in: parseInt(params.get('expires_in') || '3600', 10),
                    user: user_info ? (JSON.parse(decodeURIComponent(user_info)) as AuthenticatedUser) : null,
                };

                // Clean the URL (remove the token from the address bar)
                this.router.navigate([], { replaceUrl: true });

                // 5. BROADCAST THE NEW SESSION
                // This is the key: push the new session into the subject.
                // Anyone listening to 'session$' will now be notified.
                this.authState.next(session);
            }
        }
    }
    //Custom auth state change listener
    onAuthStateChange(callback: (session: UserSession | null) => void) {
        this.authState$.subscribe(callback);
    }
    ///////////////////////////////////////// SECURE SESSION STORAGE HELPERS (A04:2021) token persist only durin session. ////////////////////////////////
    saveToSessionStorage(token: string) {
        sessionStorage.setItem('sessionData', token);
    }
    saveToUserStorage(user: AuthenticatedUser) {
        sessionStorage.setItem('userData', JSON.stringify(user));
    }

    loadSessionFromSessionStorage() {
        return sessionStorage.getItem('sessionData');
    }
    laodUserFromSessionStorage(): AuthenticatedUser | null {
        const userString = sessionStorage.getItem('userData');
        let user: AuthenticatedUser | null = null;
        if (userString) {
            // 4. Parse the string back into an object
            user = JSON.parse(userString) as AuthenticatedUser;
            return user;
        } else {
            return null;
        }
    }
    getCurrentUser(): Observable<AuthenticatedUser | null> {
        return this.activetUser.asObservable();
    }

    getCurrentToken(): Observable<string | null> {
        return this.activeToken.asObservable();
    }
    //////////////////////////////////////

    signUp(username: string, password: string, name: string) {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            Accept: 'application/json',
        });

        const body = {
            name: name,
            email: username,
            password: password,
        };

        return this.http.post<StatusRequest>(environment.iam.signupUrl, JSON.stringify(body), { headers });
    }

    login(username: string, password: string) {
        const headers = new HttpHeaders({
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
        });

        const body = new URLSearchParams();
        body.set('grant_type', 'password');
        body.set('username', username);
        body.set('password', password);
        body.set('scope', '');
        body.set('client_id', 'string');
        body.set('client_secret', '********');

        return this.http
            .post<UserSession>(environment.iam.loginUrl, body.toString(), { headers })
            .pipe(tap((session) => this.authState.next(session)));
    }

    deleteAccount() {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${this.loadSessionFromSessionStorage()}`,
        });

        let auth_user = this.laodUserFromSessionStorage();
        const body = {
            id: auth_user?.id,
            email: auth_user?.email,
            name: auth_user?.name,
        };

        return this.http.post<UserSession>(environment.iam.deleteAccountUrl, JSON.stringify(body), { headers });
    }

    logout(): void {
        sessionStorage.removeItem('sessionData');
        sessionStorage.removeItem('userData');
        this.activetUser.next(null);
        this.activeToken.next(null);
        window.location.href = environment.home;
    }

    sendPasswordReset(credentials: { email: string }): Observable<void> {
        return this.http
            .post<any>(environment.iam.passwordResetUrl, JSON.stringify(credentials), {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                }),
            })
            .pipe(
                map((response: any) => {
                    if (response?.error) throw new Error(response.error.message);
                    return;
                }),
                tap(() => {
                    console.info('Reset password email sent to', (credentials as any).email);
                }),
                catchError((err) => {
                    console.error(`Reset password for ${(credentials as any).email} failed:`, err?.message ?? err);
                    return throwError(() => err);
                }),
            );
    }

    updateDisplayName(new_name: string) {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${this.loadSessionFromSessionStorage()}`,
        });

        let auth_user = this.laodUserFromSessionStorage();
        const body = {
            id: auth_user?.id,
            email: auth_user?.email,
            name: new_name,
        };

        return this.http
            .post<UserSession>(environment.iam.changeNameUrl, JSON.stringify(body), { headers })
            .pipe(tap((session) => this.authState.next(session)));
    }

    updatePassword(newPassword: string) {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${this.loadSessionFromSessionStorage()}`,
        });

        let auth_user = this.laodUserFromSessionStorage();
        const body = {
            id: auth_user?.id,
            email: auth_user?.email,
            name: auth_user?.name,
            password: newPassword,
        };

        return this.http
            .post<UserSession>(environment.iam.changePasswordUrl, JSON.stringify(body), { headers })
            .pipe(tap((session) => this.authState.next(session)));
    }

    verifyURL(url: string) {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${this.loadSessionFromSessionStorage()}`,
        });

        const body = {
            url: url,
        };

        return this.http.post<VerifiedUrl>(environment.iam.verifyListUrl, JSON.stringify(body), {
            headers,
        });
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///                                                    NOT-SECURE                                                              ///
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /// A04:2021 – Insecure Design: no expiration time. Data persists even when the browser is closed and reopened. Not intentend to store sensitive data, can be easelly compromised.
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    saveToLocalStorage(token: string) {
        localStorage.setItem('sessionData', token);
    }
    saveUserToLocalStorage(user: AuthenticatedUser) {
        localStorage.setItem('userData', JSON.stringify(user));
    }

    loadLocalFromLocalStorage() {
        return localStorage.getItem('sessionData');
    }
    laodUserFromLocalStorage(): AuthenticatedUser | null {
        const userString = localStorage.getItem('userData');
        let user: AuthenticatedUser | null = null;
        if (userString) {
            // 4. Parse the string back into an object
            user = JSON.parse(userString) as AuthenticatedUser;
            return user;
        } else {
            return null;
        }
    }
}
