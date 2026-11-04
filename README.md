# Battlepedia

Interaktive Enzyklopädie historischer Schlachten – Projekt im Modul Enterprise Web-Development (BHT Berlin).

- **Backend:** Spring Boot 3 (Java 17), Spring Security, JWT, Spring Data JPA, PostgreSQL
- **Frontend:** React 18 mit TypeScript, Vite, Redux Toolkit, React Router

## Stand: Meilenstein 1

| Anforderung | Umsetzung |
| --- | --- |
| Durchstich Login Frontend → Backend | Login-Formular → `POST /api/auth/login` → Spring Security → Datenbank |
| Erster Login per Basic-Authentication nach Standard | Header `Authorization: Basic base64(email:passwort)` nach RFC 7617, geprüft von Spring Security (`httpBasic`) |
| Danach tokenbasierte Authentifizierung | JWT (HS256) im **HttpOnly-Cookie**, geprüft von Spring Security (OAuth2 Resource Server) |
| Kein Token im LocalStorage | Cookie ist `HttpOnly`, `Secure`, `SameSite=Strict` – JavaScript kann es nicht lesen |
| Passwörter als Hash mit Salt | BCrypt (`BCryptPasswordEncoder`) |
| Registrierung mit E-Mail-Verifikation | Bestätigungslink (24 h gültig), erneut anforderbar |
| User-Management für Administratoren | Suchen, Blättern (Paging), Deaktivieren, Löschen |
| Zentrales Fehlermanagement | Backend: `GlobalExceptionHandler`, Frontend: `ErrorBoundary` und einheitliche API-Fehler |
| Spinner bei langen Anfragen, zentraler State | Redux Toolkit mit asynchronen Thunks, `Spinner`-Komponente |
| Konfiguration über Umgebungsvariablen | Backend: `.env` bzw. Umgebungsvariablen, Frontend: `src/config.ts` + `.env.development` |
| HTTPS | Backend mit TLS-Zertifikat, Vite-Entwicklungsserver mit HTTPS |
| Linter / statische Code-Analyse | Frontend: ESLint + Prettier, Backend: PMD (bricht den Build bei Verstößen ab) |
| Automatisierte Tests | 9 Backend-Integrationstests, 6 Frontend-Unit-Tests, 4 Ende-zu-Ende-Tests im Browser |
| CI | GitHub Actions: Build, Tests, PMD, ESLint, Prettier und E2E bei jedem Push |

## Voraussetzungen

- Java 17 oder neuer (`java -version`)
- Node.js 20 oder neuer (`node -v`)
- Optional: Docker Desktop oder eine lokal installierte PostgreSQL (nur für Variante B)

## Starten (lokale Entwicklung)

**1. Konfiguration anlegen**

```bash
cp backend/.env.example backend/.env
```

Danach in `backend/.env` eigene Werte eintragen, vor allem `JWT_SECRET`
(z. B. mit `openssl rand -base64 48` erzeugen), `SSL_KEYSTORE_PASSWORD` und `ADMIN_PASSWORD`.
Die Datei `.env` wird nicht eingecheckt.

**2. HTTPS-Zertifikat erzeugen** (einmalig, `keytool` ist Teil von Java)

```bash
cd backend
./scripts/create-dev-certificate.sh <SSL_KEYSTORE_PASSWORD aus der .env>
```

**3. Backend starten** – eine der beiden Varianten:

*Variante A – ohne Docker (eingebaute H2-Datenbank):*

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

Die Daten liegen dann in `backend/data/` und bleiben nach einem Neustart erhalten.
`DB_URL`, `DB_USERNAME` und `DB_PASSWORD` werden in dieser Variante nicht benötigt.

*Variante B – mit PostgreSQL (wie im Projektkonzept vorgesehen):*

```bash
docker compose --env-file .env -f ../docker-compose.yml up -d
./mvnw spring-boot:run
```

Das Backend läuft unter `https://localhost:8443`. Beim ersten Start wird der Administrator aus
`ADMIN_EMAIL`/`ADMIN_PASSWORD` angelegt.

**4. Frontend starten** (zweites Terminal)

```bash
cd frontend
npm install
npm run dev
```

Im Browser `https://localhost:5173` öffnen und die Zertifikatswarnung einmalig bestätigen
(selbstsigniertes Entwicklungszertifikat).

**Bestätigungslinks:** Mit `MAIL_ENABLED=false` steht der Link nach der Registrierung in der Konsole
des Backends. Mit `MAIL_ENABLED=true` und Zugangsdaten von [Mailtrap](https://mailtrap.io) wird eine
echte E-Mail an den Test-Posteingang geschickt.

## Qualitätsprüfungen

| Befehl | Ordner | Zweck |
| --- | --- | --- |
| `./mvnw verify` | `backend` | Kompilieren, Tests, PMD, Testabdeckung (`target/site/jacoco/index.html`) |
| `npm run lint` | `frontend` | ESLint |
| `npm run format:check` | `frontend` | Prettier-Formatierung |
| `npm test` | `frontend` | Unit-Tests (Vitest) |
| `npm run test:e2e` | `frontend` | Ende-zu-Ende-Tests (Backend muss laufen) |

## Projektstruktur

```
backend/src/main/java/de/bht/battlepedia/
├── auth/      Registrierung, Bestätigung, Login, Logout, Token, Cookie
├── user/      Entität User, Repository, Userverwaltung für Admins
├── mail/      Versand der Bestätigungs-E-Mails
├── config/    Security, JWT, Einstellungen, Admin-Anlage beim Start
└── common/    Fehlerformat, zentrales Fehlermanagement, Paging

frontend/src/
├── api/       Zugriff auf das Backend (fetch mit Cookie)
├── app/       Redux-Store und Hooks
├── features/  Redux-Slices und Logik je Fachbereich (auth, users)
├── components/ Wiederverwendbare Bausteine (Layout, Spinner, Formulare)
├── pages/     Seiten (Login, Registrierung, Bestätigung, Start, Userverwaltung)
└── styles/    Corporate Design
```

## REST-API (Meilenstein 1)

| Methode | Pfad | Zugriff | Beschreibung |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | öffentlich | Konto anlegen, Bestätigungslink senden |
| GET | `/api/auth/verify?token=` | öffentlich | E-Mail bestätigen |
| POST | `/api/auth/resend-verification` | öffentlich | Neuen Bestätigungslink anfordern |
| POST | `/api/auth/login` | Basic-Auth | Login, setzt das Token-Cookie |
| POST | `/api/auth/logout` | öffentlich | Löscht das Token-Cookie |
| GET | `/api/auth/me` | angemeldet | Angemeldeter User |
| GET | `/api/admin/users?search=&page=&size=` | Admin | Userliste mit Suche und Paging |
| PATCH | `/api/admin/users/{id}` | Admin | User aktivieren/deaktivieren |
| DELETE | `/api/admin/users/{id}` | Admin | User löschen |

## Abgabe als ZIP

```bash
git archive --format=zip -o battlepedia.zip HEAD
```

`git archive` packt nur eingecheckte Dateien – also ohne `node_modules`, `target`, `.env` und Zertifikate.
