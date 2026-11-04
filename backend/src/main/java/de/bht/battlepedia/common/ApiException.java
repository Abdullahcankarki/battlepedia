package de.bht.battlepedia.common;

import org.springframework.http.HttpStatus;

/**
 * Fachlicher Fehler mit passendem HTTP-Status, z. B. "User nicht gefunden" (404).
 * Wird zentral im {@link GlobalExceptionHandler} in eine {@link ApiError}-Antwort übersetzt.
 */
public class ApiException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
