package de.bht.battlepedia.config;

import de.bht.battlepedia.user.Role;
import de.bht.battlepedia.user.User;
import de.bht.battlepedia.user.UserRepository;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Legt beim Start einen Administrator an, falls ADMIN_EMAIL und ADMIN_PASSWORD gesetzt sind
 * und es dieses Konto noch nicht gibt. So steht kein Passwort im Code.
 */
@Component
public class AdminInitializer implements ApplicationRunner {

    private static final Logger LOG = LoggerFactory.getLogger(AdminInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties properties;

    public AdminInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder,
                            AppProperties properties) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.properties = properties;
    }

    @Override
    public void run(ApplicationArguments args) {
        String email = properties.admin().email();
        String password = properties.admin().password();
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            LOG.info("ADMIN_EMAIL/ADMIN_PASSWORD nicht gesetzt, es wird kein Administrator angelegt.");
            return;
        }
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(normalizedEmail)) {
            return;
        }
        User admin = new User("admin", normalizedEmail, passwordEncoder.encode(password));
        admin.setRole(Role.ADMIN);
        admin.setVerified(true);
        userRepository.save(admin);
        LOG.info("Administrator {} wurde angelegt.", normalizedEmail);
    }
}
