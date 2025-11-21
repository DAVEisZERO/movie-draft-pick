import { ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';

/*
################################################################################
###                                   DOCS                                   ###
################################################################################

PasswordMatchValidator
------------------
Custom Angular form validator function that ensures two form control values
match (typically used for password confirmation fields). Applies validation
at the FormGroup level and sets errors on the matching control to provide
immediate feedback during user input.

Configuration:
    - Takes two control names as string parameters: the primary control and
      the matching control (usually password and confirmation).
    - Returns a ValidatorFn for use in FormGroup validator arrays.

Classes:
    passwordMatchValidator (ValidatorFn)
        - Functional validator that compares two form controls within a FormGroup.
        - Throws an error if either control cannot be found in the group.
        - Only validates after the matching control has been touched (pristine check).

Functions:
    passwordMatchValidator:
        Accepts controlName and matchingControlName parameters and returns a ValidatorFn that:
            - Retrieves both controls from the FormGroup; throws if either is missing.
            - Returns null (no error) if the matching control is pristine (untouched).
            - Compares the values of both controls:
                - If values match, returns null and clears errors on the matching control.
                - If values do not match, sets a passwordsDoNotMatch error on the matching
                  control and returns the error object for FormGroup validation state.

*/

export function passwordMatchValidator(controlName: string, matchingControlName: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
        const control = group.get(controlName);
        const matchingControl = group.get(matchingControlName);

        if (!control || !matchingControl) {
            throw new Error('Form controls can not be found in the form group.');
        }
        if (matchingControl.pristine) {
            return null;
        }

        const error: ValidationErrors | null =
            control.value === matchingControl.value ? null : { passwordsDoNotMatch: { value: matchingControl.value } };
        matchingControl.setErrors(error);
        return error;
    };
}
