package de.bht.battlepedia.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Daten aus dem Registrierungsformular. Die Annotationen prüfen die Eingaben automatisch (@Valid).
 * BCrypt verarbeitet höchstens 72 Byte, daher die Obergrenze beim Passwort.
 *
 * @param username Anzeigename (3–50 Zeichen, Buchstaben, Ziffern, Punkt, Unterstrich, Bindestrich)
 * @param email    E-Mail-Adresse
 * @param password Passwort (10–72 Zeichen, mindestens eine Ziffer und ein Sonderzeichen)
 */
public record RegisterRequest(
        @NotBlank(message = "Username is required.")
        @Size(min = 3, max = 50, message = "Username must be 3 to 50 characters long.")
        @Pattern(regexp = "^[A-Za-z0-9_.-]+$",
                message = "Username may only contain letters, numbers, dots, dashes and underscores.")
        String username,

        @NotBlank(message = "Email is required.")
        @Email(message = "Please enter a valid email address.")
        @Size(max = 254, message = "Email is too long.")
        String email,

        @NotBlank(message = "Password is required.")
        @Size(min = 10, max = 72, message = "Password must be 10 to 72 characters long.")
        @Pattern(regexp = "^(?=.*\\d)(?=.*[^A-Za-z0-9]).+$",
                message = "Password must contain at least one number and one special character.")
        String password) {
}
