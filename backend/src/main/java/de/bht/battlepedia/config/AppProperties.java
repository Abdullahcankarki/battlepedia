package de.bht.battlepedia.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Alle eigenen Einstellungen unter "app" aus der application.yml als typisiertes Objekt.
 *
 * @param frontendUrl Adresse des Frontends (für Links in E-Mails und CORS)
 * @param jwt         Einstellungen für die Access-Tokens
 * @param cookie      Einstellungen für das Token-Cookie
 * @param mail        Einstellungen für den E-Mail-Versand
 * @param admin       Zugangsdaten des ersten Administrators
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(String frontendUrl, Jwt jwt, Cookie cookie, Mail mail, Admin admin) {

    /**
     * @param secret            geheimer Schlüssel zum Signieren (mindestens 32 Zeichen)
     * @param expirationMinutes Gültigkeit eines Tokens in Minuten
     */
    public record Jwt(String secret, long expirationMinutes) {
    }

    /**
     * @param secure true = Cookie wird nur über HTTPS gesendet
     */
    public record Cookie(boolean secure) {
    }

    /**
     * @param enabled false = Bestätigungslinks werden nur ins Log geschrieben
     * @param from    Absenderadresse
     */
    public record Mail(boolean enabled, String from) {
    }

    /**
     * @param email    E-Mail des Administrators, der beim Start angelegt wird
     * @param password Passwort des Administrators
     */
    public record Admin(String email, String password) {
    }
}
