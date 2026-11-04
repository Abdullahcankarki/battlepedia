package de.bht.battlepedia.user;

import static de.bht.battlepedia.TestSupport.ADMIN_EMAIL;
import static de.bht.battlepedia.TestSupport.ADMIN_PASSWORD;
import static de.bht.battlepedia.TestSupport.PASSWORD;
import static de.bht.battlepedia.TestSupport.basicAuth;
import static de.bht.battlepedia.TestSupport.login;
import static de.bht.battlepedia.TestSupport.registerAndVerify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
 * Testet die Userverwaltung: nur Administratoren haben Zugriff, Deaktivieren sperrt den Login.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserAdminTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Test
    void normalUserCannotAccessUserManagement() throws Exception {
        registerAndVerify(mockMvc, userRepository, "saladin", "saladin@example.com");
        Cookie userCookie = login(mockMvc, "saladin@example.com", PASSWORD);

        mockMvc.perform(get("/api/admin/users").cookie(userCookie))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanSearchDeactivateAndDeleteUsers() throws Exception {
        registerAndVerify(mockMvc, userRepository, "baibars", "baibars@example.com");
        Long userId = userRepository.findByEmail("baibars@example.com").orElseThrow().getId();
        Cookie adminCookie = login(mockMvc, ADMIN_EMAIL, ADMIN_PASSWORD);

        mockMvc.perform(get("/api/admin/users").param("search", "baibars").cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].email").value("baibars@example.com"));

        mockMvc.perform(patch("/api/admin/users/{id}", userId).cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"enabled\": false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));

        mockMvc.perform(post("/api/auth/login").header(HttpHeaders.AUTHORIZATION,
                        basicAuth("baibars@example.com", PASSWORD)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Your account has been deactivated."));

        mockMvc.perform(delete("/api/admin/users/{id}", userId).cookie(adminCookie))
                .andExpect(status().isNoContent());
        mockMvc.perform(delete("/api/admin/users/{id}", userId).cookie(adminCookie))
                .andExpect(status().isNotFound());
    }

    @Test
    void adminCannotDeactivateOwnAccount() throws Exception {
        Cookie adminCookie = login(mockMvc, ADMIN_EMAIL, ADMIN_PASSWORD);
        Long adminId = userRepository.findByEmail(ADMIN_EMAIL).orElseThrow().getId();

        mockMvc.perform(patch("/api/admin/users/{id}", adminId).cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"enabled\": false}"))
                .andExpect(status().isBadRequest());
    }
}
