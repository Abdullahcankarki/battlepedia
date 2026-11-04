package de.bht.battlepedia.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Anfrage, den Bestätigungslink erneut zu senden.
 *
 * @param email E-Mail-Adresse des Kontos
 */
public record ResendVerificationRequest(
        @NotBlank(message = "Email is required.")
        @Email(message = "Please enter a valid email address.")
        String email) {
}
