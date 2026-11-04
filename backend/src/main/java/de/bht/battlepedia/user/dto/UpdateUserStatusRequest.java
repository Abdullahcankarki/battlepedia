package de.bht.battlepedia.user.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Anfrage des Administrators, einen User zu aktivieren oder zu deaktivieren.
 *
 * @param enabled true = aktivieren, false = deaktivieren
 */
public record UpdateUserStatusRequest(@NotNull Boolean enabled) {
}
