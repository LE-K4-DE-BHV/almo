package de.almo.backend.auth;

import de.almo.backend.auth.dto.CreateStaffRequest;
import de.almo.backend.auth.dto.StaffResponse;
import de.almo.backend.user.User;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Kept ADMIN-only by SecurityConfig's {@code /api/admin/staff/**} rule, unlike the rest of {@code
 * /api/admin/**} which STAFF can also reach - this is the one thing a staff account must not be
 * able to do to another staff account (or its own).
 */
@RestController
@RequestMapping("/api/admin/staff")
public class AdminStaffController {

  private final AuthService authService;

  public AdminStaffController(AuthService authService) {
    this.authService = authService;
  }

  @GetMapping
  public List<StaffResponse> list() {
    return authService.listStaff().stream().map(StaffResponse::from).toList();
  }

  @PostMapping
  public ResponseEntity<StaffResponse> create(@Valid @RequestBody CreateStaffRequest request) {
    User user = authService.createStaff(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(StaffResponse.from(user));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable long id) {
    authService.deleteStaff(id);
    return ResponseEntity.noContent().build();
  }
}
