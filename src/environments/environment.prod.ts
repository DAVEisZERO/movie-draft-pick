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
    tmdbToken:
        'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkNjY1MGIwZDZlOTI1ZjRmMmMwMTIxNGEyNWVmYmUzZSIsIm5iZiI6MTcyOTkwMjY0MS4wNSwic3ViIjoiNjcxYzM4MzEzNGMwZmFiZDY4MWM5YWI4Iiwic2NvcGVzIjpbImFwaV9yZWFkIl0sInZlcnNpb24iOjF9.hXaRUY4CRiEbsCbCSIUCKWdA7WDsWMFlIr9A6yTnA8o',
};
