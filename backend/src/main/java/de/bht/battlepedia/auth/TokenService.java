package de.bht.battlepedia.auth;

import de.bht.battlepedia.config.AppProperties;
import de.bht.battlepedia.config.JwtConfig;
import de.bht.battlepedia.user.User;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.http.ResponseCookie;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

/**
 * Erstellt das JWT nach einem erfolgreichen Login und verpackt es in ein HttpOnly-Cookie.
 */
@Service
public class TokenService {

    /** Name des Cookies, in dem das Access-Token liegt. */
    public static final String COOKIE_NAME = "access_token";

    private static final String COOKIE_PATH = "/api";

    private final JwtEncoder jwtEncoder;
    private final AppProperties properties;

    public TokenService(JwtEncoder jwtEncoder, AppProperties properties) {
        this.jwtEncoder = jwtEncoder;
        this.properties = properties;
    }

    /** Signiertes JWT: subject = User-ID, roles = Rolle, exp = Ablaufzeit. */
    public String createToken(User user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("battlepedia")
                .issuedAt(now)
                .expiresAt(now.plus(tokenLifetime()))
                .subject(String.valueOf(user.getId()))
                .claim(JwtConfig.ROLES_CLAIM, List.of(user.getRole().name()))
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    /** Cookie mit dem Token: HttpOnly (kein JS-Zugriff), Secure (nur HTTPS), SameSite=Strict (Schutz vor CSRF). */
    public ResponseCookie createAccessCookie(User user) {
        return baseCookie(createToken(user)).maxAge(tokenLifetime()).build();
    }

    /** Leeres Cookie mit Lebensdauer 0: Der Browser löscht damit das Token beim Logout. */
    public ResponseCookie createLogoutCookie() {
        return baseCookie("").maxAge(Duration.ZERO).build();
    }

    private ResponseCookie.ResponseCookieBuilder baseCookie(String value) {
        return ResponseCookie.from(COOKIE_NAME, value)
                .httpOnly(true)
                .secure(properties.cookie().secure())
                .sameSite("Strict")
                .path(COOKIE_PATH);
    }

    private Duration tokenLifetime() {
        return Duration.ofMinutes(properties.jwt().expirationMinutes());
    }
}
