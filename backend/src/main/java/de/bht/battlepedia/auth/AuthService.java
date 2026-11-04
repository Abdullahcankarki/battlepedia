package de.bht.battlepedia.auth;

import de.bht.battlepedia.auth.dto.RegisterRequest;
import de.bht.battlepedia.common.ApiException;
import de.bht.battlepedia.mail.MailService;
import de.bht.battlepedia.user.User;
import de.bht.battlepedia.user.UserRepository;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Geschäftslogik rund um Konto und Anmeldung: Registrierung, E-Mail-Bestätigung und Login-Prüfung.
 */
@Service
public class AuthService {

    private static final Duration VERIFICATION_VALIDITY = Duration.ofHours(24);
    private static final int TOKEN_BYTES = 32;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, MailService mailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailService = mailService;
    }

    /**
     * Legt ein neues, noch nicht bestätigtes Konto an und verschickt den Bestätigungslink.
     * Schlägt der Versand fehl, wird durch @Transactional auch das Anlegen rückgängig gemacht.
     */
    @Transactional
    public void register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        String username = request.username().trim();
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ApiException(HttpStatus.CONFLICT, "This username is already taken.");
        }
        User user = new User(username, email, passwordEncoder.encode(request.password()));
        String token = newVerificationToken();
        user.setVerification(token, Instant.now().plus(VERIFICATION_VALIDITY));
        userRepository.save(user);
        mailService.sendVerificationMail(user, token);
    }

    /** Bestätigt die E-Mail-Adresse über den Code aus dem Link. Der Code ist danach verbraucht. */
    @Transactional
    public void verify(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "This confirmation link is invalid or has already been used."));
        if (user.getTokenExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "This confirmation link has expired. Please request a new one.");
        }
        user.setVerified(true);
        user.setVerification(null, null);
    }

    /**
     * Schickt einen neuen Bestätigungslink. Die Antwort ist immer gleich,
     * damit niemand herausfinden kann, welche E-Mail-Adressen registriert sind.
     */
    @Transactional
    public void resendVerification(String email) {
        userRepository.findByEmail(normalizeEmail(email))
                .filter(user -> !user.isVerified())
                .ifPresent(user -> {
                    String token = newVerificationToken();
                    user.setVerification(token, Instant.now().plus(VERIFICATION_VALIDITY));
                    mailService.sendVerificationMail(user, token);
                });
    }

    /**
     * Wird nach geprüftem Passwort aufgerufen: Nur bestätigte und aktive Konten dürfen sich anmelden.
     */
    @Transactional(readOnly = true)
    public User checkLoginAllowed(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));
        if (!user.isVerified()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Please confirm your email address before signing in.");
        }
        if (!user.isEnabled()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Your account has been deactivated.");
        }
        return user;
    }

    /** Liefert den angemeldeten User zur User-ID aus dem Token. Deaktivierte Konten gelten als abgemeldet. */
    @Transactional(readOnly = true)
    public User getCurrentUser(Long userId) {
        return userRepository.findById(userId)
                .filter(User::isEnabled)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Please sign in again."));
    }

    private String newVerificationToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
