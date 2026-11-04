package de.bht.battlepedia.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.bht.battlepedia.common.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

/**
 * Fehlerantworten von Spring Security (401 und 403) im selben JSON-Format wie alle anderen Fehler.
 * Wichtig: Es wird bewusst kein "WWW-Authenticate: Basic" gesendet, sonst zeigt der Browser ein eigenes Login-Fenster.
 */
@Component
public class SecurityErrorHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    public SecurityErrorHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /** 401: nicht angemeldet, falsches Passwort oder abgelaufenes Token. */
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException exception) throws IOException {
        String message;
        if (exception instanceof BadCredentialsException) {
            message = "Invalid email or password.";
        } else if (exception instanceof InvalidBearerTokenException) {
            message = "Your session has expired. Please sign in again.";
        } else {
            message = "Please sign in to continue.";
        }
        write(response, request, HttpStatus.UNAUTHORIZED, message);
    }

    /** 403: angemeldet, aber ohne die nötige Rolle. */
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException exception) throws IOException {
        write(response, request, HttpStatus.FORBIDDEN, "You do not have permission for this action.");
    }

    private void write(HttpServletResponse response, HttpServletRequest request, HttpStatus status,
                       String message) throws IOException {
        ApiError body = new ApiError(status.value(), status.getReasonPhrase(), message, request.getRequestURI(),
                Instant.now(), null);
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
