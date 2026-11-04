package de.bht.battlepedia.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * Ein Nutzerkonto. Das Passwort wird nie im Klartext gespeichert, sondern nur als BCrypt-Hash.
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.USER;

    /** false = vom Administrator deaktiviert. */
    @Column(nullable = false)
    private boolean enabled = true;

    /** true = E-Mail-Adresse wurde über den Link bestätigt. */
    @Column(nullable = false)
    private boolean verified;

    @Column(unique = true, length = 64)
    private String verificationToken;

    private Instant tokenExpiresAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    /** Leerer Konstruktor, wird von JPA benötigt. */
    protected User() {
    }

    public User(String username, String email, String passwordHash) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public String getVerificationToken() {
        return verificationToken;
    }

    public Instant getTokenExpiresAt() {
        return tokenExpiresAt;
    }

    /** Setzt einen neuen Bestätigungscode samt Ablaufzeit, oder löscht ihn mit null. */
    public void setVerification(String token, Instant expiresAt) {
        this.verificationToken = token;
        this.tokenExpiresAt = expiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
