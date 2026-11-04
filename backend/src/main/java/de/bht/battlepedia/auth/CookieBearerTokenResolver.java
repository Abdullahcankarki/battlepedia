package de.bht.battlepedia.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.stereotype.Component;
import org.springframework.web.util.WebUtils;

/**
 * Sagt Spring Security, wo das Access-Token steht: nicht im Authorization-Header,
 * sondern im HttpOnly-Cookie. So kann JavaScript im Browser das Token nie auslesen (Schutz vor XSS).
 */
@Component
public class CookieBearerTokenResolver implements BearerTokenResolver {

    @Override
    public String resolve(HttpServletRequest request) {
        Cookie cookie = WebUtils.getCookie(request, TokenService.COOKIE_NAME);
        return cookie == null ? null : cookie.getValue();
    }
}
