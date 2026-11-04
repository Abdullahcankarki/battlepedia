package de.bht.battlepedia.auth;

import static de.bht.battlepedia.TestSupport.PASSWORD;
import static de.bht.battlepedia.TestSupport.basicAuth;
import static de.bht.battlepedia.TestSupport.login;
import static de.bht.battlepedia.TestSupport.register;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import de.bht.battlepedia.user.User;
import de.bht.battlepedia.user.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Testet den kompletten Durchstich: Registrieren, Bestätigen, Login per Basic-Auth,
 * Zugriff mit JWT-Cookie und Logout.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Test
    void completeAuthenticationFlow() throws Exception {
        register(mockMvc, "william", "william@example.com");

        User saved = userRepository.findByEmail("william@example.com").orElseThrow();
        assertThat(saved.getPasswordHash()).startsWith("$2").isNotEqualTo(PASSWORD);
        assertThat(saved.isVerified()).isFalse();

        mockMvc.perform(post("/api/auth/login").header(HttpHeaders.AUTHORIZATION,
                        basicAuth("william@example.com", PASSWORD)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Please confirm your email address before signing in."));

        mockMvc.perform(get("/api/auth/verify").param("token", saved.getVerificationToken()))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/login").header(HttpHeaders.AUTHORIZATION,
                        basicAuth("william@example.com", PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("william"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("HttpOnly")))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("SameSite=Strict")));

        Cookie cookie = login(mockMvc, "william@example.com", PASSWORD);
        mockMvc.perform(get("/api/auth/me").cookie(cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("william@example.com"))
                .andExpect(jsonPath("$.role").value("USER"));

        mockMvc.perform(post("/api/auth/logout").cookie(cookie))
                .andExpect(status().isNoContent())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("Max-Age=0")));
    }

    @Test
    void wrongPasswordIsRejectedWithoutBrowserPopup() throws Exception {
        mockMvc.perform(post("/api/auth/login").header(HttpHeaders.AUTHORIZATION,
                        basicAuth("nobody@example.com", "wrong-password")))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist(HttpHeaders.WWW_AUTHENTICATE))
                .andExpect(jsonPath("$.message").value("Invalid email or password."));
    }

    @Test
    void protectedEndpointRequiresToken() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/auth/me").cookie(new Cookie(TokenService.COOKIE_NAME, "invalid.token.value")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Your session has expired. Please sign in again."));
    }

    @Test
    void invalidRegistrationReturnsFieldErrors() throws Exception {
        String body = """
                {"username": "a", "email": "not-an-email", "password": "short"}
                """;
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.username").exists())
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists());
    }

    @Test
    void duplicateEmailIsRejected() throws Exception {
        register(mockMvc, "harold", "harold@example.com");
        String body = """
                {"username": "harold2", "email": "Harold@Example.com", "password": "%s"}
                """.formatted(PASSWORD);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void invalidVerificationTokenIsRejected() throws Exception {
        mockMvc.perform(get("/api/auth/verify").param("token", "does-not-exist"))
                .andExpect(status().isBadRequest());
    }
}
