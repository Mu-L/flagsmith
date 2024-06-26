export const saveFeatureWithValidation = (cb: () => void) => {
  return () => {
    if (document.getElementById('language-validation-error')) {
      openConfirm({
        body: 'Your remote config value does not pass validation for the language you have selected. Are you sure you wish to save?',
        noText: 'Cancel',
        onYes: () => cb(),
        title: 'Validation error',
        yesText: 'Save',
      })
    } else {
      cb()
    }
  }
}
