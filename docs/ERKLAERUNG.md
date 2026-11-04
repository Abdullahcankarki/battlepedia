# Erklärung des Codes (Meilenstein 1)

Dieses Dokument erklärt den Code so, dass du ihn im Abnahmegespräch erklären kannst. Am Ende stehen
typische Fragen mit Antworten.

---

## 1. Das große Bild

```
Browser (React)                     Spring Boot                          PostgreSQL
───────────────                     ───────────                          ──────────
LoginPage ──► authSlice.login ──►  POST /api/auth/login
             authApi.login          │ 1. Filterkette "Login" (Basic-Auth)
             (Header: Basic ...)    │    AppUserDetailsService ───────►  SELECT user
                                    │    BCrypt vergleicht Passwort
                                    │ 2. AuthController.login
                                    │    AuthService.checkLoginAllowed
                                    │    TokenService: JWT + Cookie
             ◄── 200 + Set-Cookie ──┘
Browser speichert Cookie (HttpOnly)

HomePage ──► authApi.me ─────────►  GET /api/auth/me
             (Cookie automatisch)   │ 1. Filterkette "API": Token aus Cookie lesen,
                                    │    Signatur und Ablaufzeit prüfen
                                    │ 2. AuthController.me ─────────────►  SELECT user
             ◄── 200 + User-JSON ───┘
```

**Wichtig:** Das Frontend sieht das Token nie. Der Browser speichert es im Cookie und schickt es bei
jeder Anfrage an `/api` automatisch mit.

---

## 2. Login Schritt für Schritt

1. **`LoginPage.tsx`**: Der Nutzer gibt E-Mail und Passwort ein. Beim Absenden wird
   `dispatch(login({ email, password }))` aufgerufen.
2. **`authSlice.ts`**: `login` ist ein asynchroner Thunk (`createAsyncThunk`). Während der Anfrage ist
   `loading = true`, daher zeigt der Button „Signing in…“.
3. **`authApi.ts`**: `basicAuthHeader()` baut den Header nach dem Standard (RFC 7617):
   `Authorization: Basic ` + Base64 von `email:passwort`.
4. **`client.ts`**: `fetch()` mit `credentials: 'include'`, damit Cookies gesendet und gespeichert werden.
5. **`SecurityConfig.loginFilterChain`**: Gilt nur für `/api/auth/login`. `httpBasic()` liest den Header,
   lädt den User über **`AppUserDetailsService`** und lässt **BCrypt** das Passwort vergleichen.
   Falsches Passwort → `SecurityErrorHandler` antwortet mit 401 im JSON-Format.
6. **`AuthController.login`**: Wird nur erreicht, wenn das Passwort stimmt. `AuthService.checkLoginAllowed`
   prüft, ob die E-Mail bestätigt und das Konto aktiv ist.
7. **`TokenService`**: Erstellt das JWT und verpackt es in ein Cookie:
   - `HttpOnly`: JavaScript kann das Cookie nicht lesen (Schutz vor XSS)
   - `Secure`: wird nur über HTTPS gesendet
   - `SameSite=Strict`: wird nicht bei Anfragen von fremden Webseiten mitgeschickt (Schutz vor CSRF)
   - `Path=/api`, `Max-Age` = Lebensdauer des Tokens (60 Minuten)
8. Die Antwort enthält den User als JSON (ohne Passwort-Hash). Redux speichert ihn in `state.auth.user`.
   `GuestRoute` merkt, dass jetzt jemand angemeldet ist, und leitet zur Startseite weiter.

## 3. Jede weitere Anfrage

1. Der Browser schickt das Cookie `access_token` automatisch mit.
2. **`SecurityConfig.apiFilterChain`** nutzt den **OAuth2 Resource Server** von Spring Security.
   **`CookieBearerTokenResolver`** sagt ihm, dass das Token im Cookie steht (statt im Header).
3. Der **`JwtDecoder`** (aus `JwtConfig`) prüft Signatur und Ablaufzeit. Ist das Token kaputt oder
   abgelaufen → 401.
4. Der **`JwtAuthenticationConverter`** macht aus dem Claim `roles: ["ADMIN"]` die Spring-Rolle
   `ROLE_ADMIN`. Damit greift die Regel `.requestMatchers("/api/admin/**").hasRole("ADMIN")`.
5. Im Controller bekommt man das geprüfte Token über `@AuthenticationPrincipal Jwt jwt`.
   `jwt.getSubject()` ist die User-ID.

**App-Start:** `App.tsx` ruft `fetchCurrentUser()` auf. Ist das Cookie noch gültig, liefert `/me` den User
und man bleibt nach einem Neuladen angemeldet.

**Logout:** `POST /api/auth/logout` setzt das Cookie mit `Max-Age=0`. Der Browser löscht es.

## 4. Registrierung und E-Mail-Bestätigung

1. `RegisterPage.tsx` prüft die Eingaben zuerst im Browser (`validation.ts`), damit der Nutzer sofort
   Rückmeldung bekommt.
2. Das Backend prüft dieselben Regeln noch einmal mit Annotationen in **`RegisterRequest`**
   (`@NotBlank`, `@Email`, `@Size`, `@Pattern`) und `@Valid` im Controller. Grund: Man darf dem Browser
   nie vertrauen, Anfragen können auch ohne Frontend geschickt werden.
3. **`AuthService.register`**: E-Mail klein schreiben, auf doppelte E-Mail/Name prüfen, Passwort mit
   BCrypt hashen, zufälligen Bestätigungscode erzeugen (`SecureRandom`, 32 Byte), speichern, E-Mail senden.
   `@Transactional`: Wenn der Mailversand fehlschlägt, wird auch das Speichern rückgängig gemacht.
4. **`MailService`**: Schickt den Link `https://localhost:5173/verify?token=...`. Bei `MAIL_ENABLED=false`
   steht der Link nur im Log.
5. **`VerifyPage.tsx`** liest den Code aus der URL und ruft `GET /api/auth/verify?token=...` auf.
   **`AuthService.verify`** setzt `verified = true` und löscht den Code, damit er nur einmal funktioniert.

## 5. Userverwaltung (nur Admin)

- **`UserController`** (`/api/admin/users`): Liste mit Suche und Paging, aktivieren/deaktivieren, löschen.
- **`UserService`**: Ein Admin kann sich nicht selbst deaktivieren oder löschen.
- **Paging**: `PageRequest.of(page, size, Sort)` → Spring Data lädt nur 10 Einträge statt aller.
  So funktioniert die Liste auch mit sehr vielen Usern.
- Frontend: **`AdminUsersPage.tsx`** mit Suchfeld (wartet 300 ms nach dem Tippen), Tabelle, Blättern
  und einer Sicherheitsabfrage (`ConfirmDialog`) vor dem Löschen.
- Der **`AdminInitializer`** legt beim Start den ersten Administrator an, damit kein Passwort im Code steht.

## 6. Fehlermanagement

- **Backend:** Jeder Fehler in einem Controller landet im **`GlobalExceptionHandler`**
  (`@RestControllerAdvice`) und wird als **`ApiError`** zurückgegeben:
  `{ status, error, message, path, timestamp, fieldErrors }`.
  Eigene fachliche Fehler werfen wir als `ApiException(HttpStatus, Nachricht)`.
  Unerwartete Fehler werden geloggt, nach außen gibt es nur eine neutrale Meldung (keine internen Details).
- Fehler von Spring Security (401, 403) entstehen vor dem Controller. Dafür gibt es den
  **`SecurityErrorHandler`**, der dasselbe JSON-Format schreibt.
- **Frontend:** `client.ts` macht aus jeder Fehlerantwort eine `ApiError`-Exception mit Nachricht.
  Die Thunks geben sie als `rejectWithValue` weiter, die Seiten zeigen sie mit `<Alert>` an.
  Ist der Server nicht erreichbar, gibt es eine eigene Meldung. Die **`ErrorBoundary`** fängt
  Fehler beim Rendern ab, damit nie eine weiße Seite erscheint.

## 7. Wichtige Spring-Begriffe

| Begriff | Bedeutung im Projekt |
| --- | --- |
| `@SpringBootApplication` | Startet Spring und sucht alle Klassen im Paket `de.bht.battlepedia` |
| `@RestController` | Klasse mit REST-Endpunkten, Rückgabewerte werden automatisch zu JSON |
| `@Service` | Klasse mit Geschäftslogik |
| `@Component` | Allgemeine Spring-Komponente (z. B. `SecurityErrorHandler`) |
| Dependency Injection | Spring übergibt benötigte Objekte im Konstruktor, z. B. `AuthService(UserRepository ...)`. Wir erzeugen sie nie selbst mit `new`. |
| `@Bean` | Methode in einer `@Configuration`-Klasse, deren Rückgabewert Spring verwaltet (z. B. `PasswordEncoder`) |
| `JpaRepository` | Fertige Methoden wie `save`, `findById`, `delete`. Weitere werden aus dem Namen erzeugt: `findByEmail` → `SELECT ... WHERE email = ?` |
| `@Entity` | Klasse, die einer Tabelle entspricht (`User` → Tabelle `users`) |
| `@Transactional` | Alles in der Methode passiert in einer Datenbank-Transaktion: entweder alles oder nichts |
| `@Valid` | Prüft die Annotationen im DTO, bei Fehlern → 400 mit `fieldErrors` |
| DTO / `record` | Einfache Datenobjekte für Anfragen und Antworten. So geben wir nie die Entität (mit Passwort-Hash) direkt heraus. |
| `SecurityFilterChain` | Kette von Filtern, die jede Anfrage vor dem Controller durchläuft |
| `@ConfigurationProperties` | Liest die Einstellungen unter `app:` aus der `application.yml` in `AppProperties` |

## 8. Sicherheitsbegriffe

| Begriff | Kurz erklärt |
| --- | --- |
| Basic-Authentication | Standardverfahren: `Authorization: Basic base64(user:passwort)`. Base64 ist **keine** Verschlüsselung, deshalb nur über HTTPS. Wird bei uns nur einmal beim Login genutzt. |
| JWT | Token aus drei Teilen `Header.Payload.Signatur` (Base64). Payload enthält `sub` (User-ID), `roles`, `exp` (Ablauf). Die Signatur (HMAC-SHA256 mit geheimem Schlüssel) verhindert Fälschungen. |
| Warum JWT? | Der Server muss sich keine Sessions merken (zustandslos). Er prüft nur die Signatur. |
| HttpOnly-Cookie | Kann von JavaScript nicht gelesen werden. Selbst bei einer XSS-Lücke kann kein Skript das Token stehlen. LocalStorage dagegen kann jedes Skript lesen. |
| SameSite=Strict | Cookie wird nicht mitgeschickt, wenn eine fremde Webseite eine Anfrage auslöst → Schutz vor CSRF. Deshalb ist die CSRF-Prüfung von Spring abgeschaltet. |
| BCrypt + Salt | Hash-Verfahren, das absichtlich langsam ist. Für jedes Passwort wird ein zufälliges Salt erzeugt und im Hash mitgespeichert (`$2a$10$...`). Gleiche Passwörter ergeben daher verschiedene Hashes. |
| CORS | Erlaubt nur dem eigenen Frontend (`FRONTEND_URL`) Anfragen mit Cookies. In der Entwicklung leitet Vite `/api` weiter, Frontend und API haben dann dieselbe Adresse. |
| HTTPS | Backend mit TLS-Zertifikat (`server.ssl`), Vite ebenfalls mit HTTPS. Das Entwicklungszertifikat ist selbstsigniert. |
| Geheimnisse | `JWT_SECRET`, Passwörter usw. stehen nur in `.env` bzw. Umgebungsvariablen, nie im Git. |

## 9. Frontend-Begriffe

| Begriff | Bedeutung im Projekt |
| --- | --- |
| Redux Store (`store.ts`) | Zentraler Speicher. `auth` = wer angemeldet ist, `users` = Userliste des Admins |
| Slice | Teil des Stores mit Zustand und Reducern (`authSlice`, `usersSlice`) |
| `createAsyncThunk` | Asynchrone Aktion (API-Aufruf) mit drei Zuständen: `pending`, `fulfilled`, `rejected` |
| `ProtectedRoute` | Leitet nicht angemeldete Nutzer zum Login. Mit `role="ADMIN"` nur für Admins. Die echte Sicherheit liegt aber im Backend. |
| `config.ts` | Konfigurationsmodul. Die API-Adresse kommt aus `VITE_API_BASE_URL`. |
| Vite-Proxy | Leitet `/api/...` vom Entwicklungsserver an `https://localhost:8443` weiter |
| ESLint / Prettier | ESLint findet Fehler und schlechte Muster, Prettier sorgt für einheitliche Formatierung |

---

## 10. Mögliche Prüfungsfragen

**1. Wie läuft der Login ab?**
Das Frontend schickt E-Mail und Passwort einmal per Basic-Authentication. Spring Security prüft das
Passwort mit BCrypt. Danach erstellt der `TokenService` ein JWT und schickt es als HttpOnly-Cookie zurück.
Alle weiteren Anfragen nutzen nur noch dieses Token.

**2. Warum liegt das Token nicht im LocalStorage?**
LocalStorage kann jedes JavaScript auf der Seite lesen. Bei einer XSS-Lücke könnte ein Angreifer das Token
stehlen. Ein HttpOnly-Cookie ist für JavaScript unsichtbar.

**3. Wie wird das Token geprüft?**
Der `CookieBearerTokenResolver` holt das Token aus dem Cookie, der `JwtDecoder` prüft die Signatur mit dem
geheimen Schlüssel und die Ablaufzeit. Erst dann erreicht die Anfrage den Controller.

**4. Was steht im JWT?**
`iss` (battlepedia), `iat` (erstellt), `exp` (läuft ab), `sub` (User-ID) und `roles` (z. B. `["USER"]`).
Keine Passwörter oder anderen geheimen Daten, denn der Inhalt ist nur Base64-kodiert, nicht verschlüsselt.

**5. Warum zwei SecurityFilterChains?**
Die erste gilt nur für `/api/auth/login` und akzeptiert Basic-Authentication. Die zweite gilt für alle
anderen Pfade und akzeptiert nur das JWT. So kann man E-Mail und Passwort nicht bei jeder Anfrage schicken.
`@Order(1)` sorgt dafür, dass die Login-Kette zuerst geprüft wird.

**6. Was macht BCrypt, was ist ein Salt?**
BCrypt berechnet aus dem Passwort einen Hash, aus dem man das Passwort nicht zurückrechnen kann. Das Salt
ist ein Zufallswert, der vor dem Hashen ergänzt wird. Dadurch haben zwei Nutzer mit gleichem Passwort
unterschiedliche Hashes, und vorberechnete Tabellen (Rainbow Tables) helfen Angreifern nicht.

**7. Warum wird nach dem Passwort noch `checkLoginAllowed` aufgerufen?**
Damit man erst mit richtigem Passwort erfährt, ob ein Konto unbestätigt oder deaktiviert ist. Sonst könnte
jeder ohne Passwort herausfinden, welche E-Mails registriert sind.

**8. Was passiert, wenn ein Admin einen User deaktiviert?**
`enabled` wird `false`. Beim nächsten Login gibt es 403 „Your account has been deactivated“. Auch `/me`
liefert dann 401, sodass das Frontend ihn abmeldet.

**9. Was ist Dependency Injection?**
Spring erzeugt die Objekte (z. B. `UserRepository`) und übergibt sie im Konstruktor. Wir schreiben nie
`new UserService(...)`. Das macht die Klassen unabhängig voneinander und gut testbar.

**10. Woher kommt die SQL-Abfrage bei `findByEmail`?**
Spring Data JPA erzeugt sie aus dem Methodennamen: `findBy` + Feld `email` → `WHERE email = ?`.

**11. Was macht `@Transactional` bei der Registrierung?**
Speichern und E-Mail-Versand gehören zusammen. Wirft der Mailversand eine Exception, wird das Speichern des
Users zurückgerollt. Es entsteht also kein Konto ohne Bestätigungslink.

**12. Wie funktioniert das zentrale Fehlermanagement?**
`@RestControllerAdvice` fängt Exceptions aus allen Controllern. Für jeden Fehlertyp gibt es eine Methode
mit `@ExceptionHandler`, die eine `ApiError`-Antwort mit passendem Status baut. Die letzte Methode fängt
alle übrigen Exceptions ab, damit nie ein Absturz oder Stacktrace nach außen geht.

**13. Warum DTOs statt die Entität direkt zurückzugeben?**
Die Entität `User` enthält den Passwort-Hash und den Bestätigungscode. Das DTO `UserResponse` enthält nur
die Felder, die das Frontend sehen darf.

**14. Wie funktioniert Paging?**
Das Frontend schickt `page` und `size`. Der Service baut daraus ein `PageRequest`, die Datenbank liefert nur
diese Einträge plus die Gesamtzahl. `PageResponse` schickt Inhalt, Seite und Gesamtzahl zurück.

**15. Was schützt vor CSRF?**
Das Cookie hat `SameSite=Strict`. Der Browser schickt es nicht mit, wenn eine fremde Seite eine Anfrage an
unsere API auslöst.

**16. Warum wird das Passwort-Formular im Browser und im Backend geprüft?**
Im Browser für schnelle Rückmeldung, im Backend für die Sicherheit. Anfragen können auch ohne das
Frontend (z. B. mit curl) geschickt werden.

**17. Wie bleibt man nach dem Neuladen angemeldet?**
Das Cookie bleibt im Browser. Beim Start ruft `App.tsx` `fetchCurrentUser()` auf, das Backend erkennt das
Token und liefert den User.

**18. Was macht `createAsyncThunk`?**
Er führt den API-Aufruf aus und löst automatisch `pending`, `fulfilled` oder `rejected` aus. Im Slice
reagieren wir darauf, z. B. `loading = true` für den Spinner.

**19. Wie sind Geheimnisse geschützt?**
Sie stehen in `backend/.env` bzw. in Umgebungsvariablen. Die Datei ist in `.gitignore` eingetragen.
`.env.example` zeigt nur die Namen mit Platzhaltern.

**20. Was prüft PMD?**
PMD analysiert den Java-Code statisch auf typische Fehler und schlechten Stil (z. B. ungenutzte Variablen,
verlorene Stacktraces). `mvn verify` bricht bei Verstößen ab. Die Regel `GuardLogStatement` ist bewusst
abgeschaltet, weil SLF4J mit `{}`-Platzhaltern arbeitet.

**21. Was passiert, wenn das Token abläuft?**
Der `JwtDecoder` lehnt es ab, der `SecurityErrorHandler` antwortet mit 401. Im Frontend setzt der Matcher
im `authSlice` den User auf `null`, und `ProtectedRoute` leitet zum Login.

**22. Warum bekommt man bei falschem Passwort kein Browser-Popup?**
Spring würde normalerweise `WWW-Authenticate: Basic` senden, dann zeigt der Browser ein eigenes
Login-Fenster. Unser `SecurityErrorHandler` sendet diesen Header nicht, sondern nur JSON.
