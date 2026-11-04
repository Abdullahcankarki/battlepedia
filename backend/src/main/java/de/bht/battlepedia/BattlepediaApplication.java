package de.bht.battlepedia;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Startpunkt der Anwendung. Spring Boot sucht ab diesem Paket alle Komponenten
 * (Controller, Services, Repositories, Konfigurationen) und startet den Webserver.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
@SuppressWarnings("PMD.UseUtilityClass") // Spring Boot muss die Klasse instanziieren können
public class BattlepediaApplication {

    public static void main(String[] args) {
        SpringApplication.run(BattlepediaApplication.class, args);
    }
}
