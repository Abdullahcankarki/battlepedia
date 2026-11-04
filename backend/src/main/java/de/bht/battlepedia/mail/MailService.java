package de.bht.battlepedia.mail;

import de.bht.battlepedia.common.ApiException;
import de.bht.battlepedia.config.AppProperties;
import de.bht.battlepedia.user.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Versendet die E-Mail mit dem Bestätigungslink. Ist der Versand abgeschaltet (MAIL_ENABLED=false),
 * wird der Link nur ins Log geschrieben, damit man lokal ohne Mailserver testen kann.
 */
@Service
public class MailService {

    private static final Logger LOG = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mailSender;
    private final AppProperties properties;

    public MailService(JavaMailSender mailSender, AppProperties properties) {
        this.mailSender = mailSender;
        this.properties = properties;
    }

    public void sendVerificationMail(User user, String token) {
        String link = properties.frontendUrl() + "/verify?token=" + token;
        if (!properties.mail().enabled()) {
            LOG.info("E-Mail-Versand ist deaktiviert. Bestätigungslink für {}: {}", user.getEmail(), link);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(properties.mail().from());
        message.setTo(user.getEmail());
        message.setSubject("Confirm your email address");
        message.setText("Hello " + user.getUsername() + ",\n\n"
                + "please confirm your email address to activate your Battlepedia account:\n"
                + link + "\n\n"
                + "The link is valid for 24 hours. If you did not create an account, you can ignore this email.\n");
        try {
            mailSender.send(message);
        } catch (MailException ex) {
            LOG.error("Verifikations-E-Mail an {} konnte nicht gesendet werden", user.getEmail(), ex);
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "The confirmation email could not be sent. Please try again later.", ex);
        }
    }
}
