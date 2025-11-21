import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { take, map } from 'rxjs';
import { AuthService } from '../services/auth.service';

/*
################################################################################
###                                   DOCS                                   ###
################################################################################

NoAuthGuard
------------------
Route guard function that prevents authenticated users from accessing routes
meant for unauthenticated visitors (e.g. login, signup). Allows navigation
when there is no active token; redirects authenticated users to the app root.

Configuration:
    - Depends on AuthService.getCurrentToken() to observe current token state.
    - Used in route definitions as a CanActivateFn (e.g. { canActivate: [noAuthGuard] }).
    - Uses Router.createUrlTree to perform a declarative redirect for authenticated users.

Classes:
    noAuthGuard (CanActivateFn)
        - Functional guard using Angular's inject() helper.
        - Performs a single-value check (take(1)) on the token observable to decide access.

Functions:
    noAuthGuard:
        Checks the current token observable:
            - If no token is present (user is unauthenticated) returns true to allow navigation.
            - If a token exists (user is authenticated) returns a UrlTree redirecting to ['/'].

*/

export const noAuthGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.getCurrentToken().pipe(
        take(1),
        map((user) => {
            if (!user) {
                return true;
            } else {
                return router.createUrlTree(['/'], { relativeTo: null });
            }
        }),
    );
};
