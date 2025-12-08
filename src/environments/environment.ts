// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
const BASE_IAM_URL = 'https://127.0.0.1:8000/api/v1';

export const environment = {
    production: false,
    home: 'http://localhost:8100',
    backendUrl: 'https://letterboxd-list-scraper-lcoj.onrender.com',
    iam: {
        loginUrl: `${BASE_IAM_URL}/auth/login/`,
        signupUrl: `${BASE_IAM_URL}/entrypoints/signup/`,
        deleteAccountUrl: `${BASE_IAM_URL}/users/remove/`,
        passwordResetUrl: `${BASE_IAM_URL}/entrypoints/forgotpassword/`,
        changeNameUrl: `${BASE_IAM_URL}/changeName/`,
        changePasswordUrl: `${BASE_IAM_URL}/changePassword/`,
        verifyListUrl: `${BASE_IAM_URL}/fetchsecure/`,
    },
    tmdbToken: '',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
