package de.bht.battlepedia;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import de.bht.battlepedia.auth.TokenService;
import de.bht.battlepedia.user.User;
import de.bht.battlepedia.user.UserRepository;
import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Hilfsmethoden für die Integrationstests: registrieren, bestätigen und einloggen.
 */
public final class TestSupport {

    public static final String ADMIN_EMAIL = "admin@battlepedia.test";
    public static final String ADMIN_PASSWORD = "Admin-Passw0rd!";
    public static final String PASSWORD = "Hastings-1066!";

    private TestSupport() {
    }

    public static String basicAuth(String email, String password) {
        String credentials = email + ":" + password;
        return "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
    }

    public static void register(MockMvc mockMvc, String username, String email) throws Exception {
        String body = """
                {"username": "%s", "email": "%s", "password": "%s"}
                """.formatted(username, email, PASSWORD);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());
    }

    public static void registerAndVerify(MockMvc mockMvc, UserRepository repository, String username,
                                         String email) throws Exception {
        register(mockMvc, username, email);
        User user = repository.findByEmail(email).orElseThrow();
        mockMvc.perform(get("/api/auth/verify").param("token", user.getVerificationToken()))
                .andExpect(status().isOk());
    }

    /** Loggt per Basic-Authentication ein und gibt das Token-Cookie zurück. */
    public static Cookie login(MockMvc mockMvc, String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .header(HttpHeaders.AUTHORIZATION, basicAuth(email, password)))
                .andExpect(status().isOk())
                .andReturn();
        String setCookie = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        String value = setCookie.substring(setCookie.indexOf('=') + 1, setCookie.indexOf(';'));
        return new Cookie(TokenService.COOKIE_NAME, value);
    }
}
