package de.bht.battlepedia.auth;

import de.bht.battlepedia.auth.dto.RegisterRequest;
import de.bht.battlepedia.auth.dto.ResendVerificationRequest;
import de.bht.battlepedia.common.MessageResponse;
import de.bht.battlepedia.user.User;
import de.bht.battlepedia.user.dto.UserResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST-Endpunkte für Registrierung, E-Mail-Bestätigung, Login, Logout und den angemeldeten User.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final TokenService tokenService;

    public AuthController(AuthService authService, TokenService tokenService) {
        this.authService = authService;
        this.tokenService = tokenService;
    }

    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(new MessageResponse(
                "Registration successful. Please check your inbox and confirm your email address."));
    }

    @GetMapping("/verify")
    public MessageResponse verify(@RequestParam String token) {
        authService.verify(token);
        return new MessageResponse("Your email address has been confirmed. You can now sign in.");
    }

    @PostMapping("/resend-verification")
    public MessageResponse resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerification(request.email());
        return new MessageResponse("If an unconfirmed account exists for this email, a new link has been sent.");
    }

    /**
     * Login: Die Basic-Authentication (E-Mail und Passwort im Authorization-Header) hat Spring Security
     * bereits geprüft, bevor diese Methode läuft. Hier wird nur noch das JWT-Cookie ausgestellt.
     */
    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(Authentication authentication) {
        User user = authService.checkLoginAllowed(authentication.getName());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, tokenService.createAccessCookie(user).toString())
                .body(UserResponse.from(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, tokenService.createLogoutCookie().toString())
                .build();
    }

    /** Liefert den angemeldeten User. Das Frontend fragt das beim Start ab, um zu wissen, wer eingeloggt ist. */
    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal Jwt jwt) {
        return UserResponse.from(authService.getCurrentUser(Long.valueOf(jwt.getSubject())));
    }
}
