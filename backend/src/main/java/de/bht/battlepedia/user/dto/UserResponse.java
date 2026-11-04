package de.bht.battlepedia.user.dto;

import de.bht.battlepedia.user.Role;
import de.bht.battlepedia.user.User;
import java.time.Instant;

/**
 * Daten eines Users, die an das Frontend gehen. Der Passwort-Hash ist bewusst nicht enthalten.
 *
 * @param id        ID des Users
 * @param username  Anzeigename
 * @param email     E-Mail-Adresse
 * @param role      Rolle (USER oder ADMIN)
 * @param enabled   false = deaktiviert
 * @param verified  true = E-Mail bestätigt
 * @param createdAt Registrierungszeitpunkt
 */
public record UserResponse(Long id, String username, String email, Role role, boolean enabled, boolean verified,
                           Instant createdAt) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getRole(), user.isEnabled(),
                user.isVerified(), user.getCreatedAt());
    }
}
