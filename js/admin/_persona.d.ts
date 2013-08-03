// Typing information for the Persona interface

interface PersonaWatchOptions {
    loggedInUser: String
    onlogin: (String) => void
    onlogout: () => void
    onready?: () => void
}

interface PersonaRequestOptions {
    backgroundColor?: String
    siteName?: String
    siteLogo?: String
    termsOfService?: String
    privacyPolicy?: String
    returnTo?: String
    oncancel?: () => void
}

interface Persona {
    watch( options: PersonaWatchOptions ): void
    request( options: PersonaRequestOptions ): void
    request(): void
    logout(): void
}

interface Navigator {
    id: Persona
}

