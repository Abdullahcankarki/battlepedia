package de.bht.battlepedia.user;

import de.bht.battlepedia.common.ApiException;
import de.bht.battlepedia.common.PageResponse;
import de.bht.battlepedia.user.dto.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Geschäftslogik der Userverwaltung (nur für Administratoren).
 */
@Service
public class UserService {

    private static final int MAX_PAGE_SIZE = 100;

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found."));
    }

    /** Liefert eine Seite der User, optional gefiltert nach Name oder E-Mail. Neueste zuerst. */
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> findUsers(String search, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> users;
        if (search == null || search.isBlank()) {
            users = userRepository.findAll(pageable);
        } else {
            String term = search.trim();
            users = userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(term, term,
                    pageable);
        }
        return PageResponse.from(users.map(UserResponse::from));
    }

    @Transactional
    public UserResponse setEnabled(Long id, boolean enabled, Long currentUserId) {
        if (id.equals(currentUserId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot deactivate your own account.");
        }
        User user = getById(id);
        user.setEnabled(enabled);
        return UserResponse.from(user);
    }

    @Transactional
    public void delete(Long id, Long currentUserId) {
        if (id.equals(currentUserId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot delete your own account.");
        }
        userRepository.delete(getById(id));
    }
}
