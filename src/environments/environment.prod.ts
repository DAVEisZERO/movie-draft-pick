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
