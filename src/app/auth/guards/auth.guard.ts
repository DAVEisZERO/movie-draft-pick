import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs';

/*
################################################################################
###                                   DOCS                                   ###
################################################################################

AuthGuard
------------------
Route guard function that protects application routes by verifying an active
authentication token. If a token is present the guard allows navigation;
otherwise it redirects the user to the auth/login route.

Configuration:
    - Depends on AuthService.getCurrentToken() emitting the current token state.
    - Used in route definitions as a CanActivateFn (e.g. { canActivate: [authGuard] }).
    - Uses Router.createUrlTree to perform an immediate, declarative redirect to the login page.

Classes:
    authGuard (CanActivateFn)
        - Lightweight functional guard (no class).
        - Injects AuthService and Router using Angular's inject() helper.
        - Performs a single-value check (take(1)) on the token observable to decide route access.

Functions:
    authGuard:
        Evaluates the current token observable:
            - If a token value is truthy, returns true allowing navigation.
            - If no token is present, returns a UrlTree redirecting to ['auth', 'login'].

*/

export const authGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.getCurrentToken().pipe(
        take(1),
        map((user) => {
            if (user) {
                return true;
            } else {
                return router.createUrlTree(['auth', 'login'], { relativeTo: null });
            }
        }),
    );
};
