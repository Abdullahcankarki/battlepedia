package de.bht.battlepedia.user;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Datenbankzugriff für User. Spring Data erzeugt die SQL-Abfragen automatisch aus den Methodennamen.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByVerificationToken(String verificationToken);

    boolean existsByEmail(String email);

    boolean existsByUsernameIgnoreCase(String username);

    Page<User> findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(String username, String email,
                                                                             Pageable pageable);
}
