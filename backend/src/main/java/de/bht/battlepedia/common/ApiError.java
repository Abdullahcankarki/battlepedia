package de.bht.battlepedia.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.Map;

/**
 * Einheitliches Fehlerformat für alle Fehlerantworten der API.
 *
 * @param status      HTTP-Statuscode, z. B. 404
 * @param error       Kurzbezeichnung des Status, z. B. "Not Found"
 * @param message     verständliche Fehlermeldung für die Oberfläche
 * @param path        aufgerufener Pfad
 * @param timestamp   Zeitpunkt des Fehlers
 * @param fieldErrors Fehler je Eingabefeld (nur bei Validierungsfehlern)
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(int status, String error, String message, String path, Instant timestamp,
                       Map<String, String> fieldErrors) {
}
