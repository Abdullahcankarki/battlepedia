package de.bht.battlepedia.common;

import java.util.List;
import org.springframework.data.domain.Page;

/**
 * Eine Seite einer Liste (Paging) in einem schlanken JSON-Format.
 *
 * @param content       Einträge der aktuellen Seite
 * @param page          Nummer der Seite (beginnt bei 0)
 * @param size          Anzahl der Einträge pro Seite
 * @param totalElements Gesamtzahl aller Einträge
 * @param totalPages    Gesamtzahl der Seiten
 * @param <T>           Typ der Einträge
 */
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }
}
