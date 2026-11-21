# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PARTIME.VN, a shift-based part-time job platform for students (graduation project CDTN02, Văn Lang University). It has three roles, **student / employer / admin**. Each role has its own portal, and each portal is owned by a different team member. The code, comments, UI strings, commit messages and docs are mostly in Vietnamese. Keep new user-facing text in Vietnamese.

## Commands

```bash
# Backend (Python Flask + Flask-SocketIO), port 8002
cd Backend && pip install -r requirements.txt
cd Backend && python server.py            # API + Socket.IO; also serves frontend/dist if built

# Frontend (React 18 + Vite 5 + Tailwind + Three.js)
cd frontend && npm install
cd frontend && npm run dev                # :5173, proxies /api and /uploads to 127.0.0.1:8002
cd frontend && npm run build              # -> frontend/dist (served by Flask in unified mode)
npm run dev:student | dev:employer | dev:admin   # Vite on 3001/3002/3003

# Unified mode (builds dist if missing, then serves everything on :8002)
python run.py                             # or run.bat; run_separate_roles.bat = backend + 3 Vite ports

# Docker
docker compose up --build                 # health check: GET /api/health
```

There is no linter and there are no backend unit tests. The only test suite is the Selenium end-to-end suite in `test/`. It needs the app running at the `BASE_URL` set in the Excel config sheet (default `http://localhost:8002`).

```bash
cd test && mvn test                       # or run_selenium_tests.bat (falls back to javac + resolve_cp.py when Maven is missing)
mvn test -DroleFilter=SV                  # run one role only: SV | NTD | QTV (also STUDENT/EMPLOYER/ADMIN)
mvn test -Dheadless=true -DdemoSpeedMs=0 -Dhighlight=false   # fast, no visible browser
```

## Architecture

**Single-port deployment.** `Backend/server.py:create_app()` registers five blueprints: `auth` (`/api/auth`), `student` (`/api/student`), `employer` (`/api/employer`), `admin` (`/api/admin`) and `common` (`/api`). A catch-all route then serves `frontend/dist` and falls back to `index.html` for SPA routes. Unmatched `/api/*` paths and missing media files return JSON 404s instead of `index.html`. `/uploads/<file>` is served from disk first, then from GridFS, and finally falls back to a transparent PNG. `run.py` imports `create_app` and `socketio` from the backend and runs them.

**Role routing in one SPA.** `frontend/src/App.jsx` picks the portal from the URL path (`/student` or `/`, `/employer`, `/admin`) and renders one of the large single-file portals: `features/{student,employer,admin}/*Portal.jsx`. Each portal is 5–8k lines, so search inside these files rather than reading them whole. Auth state is stored per role (`localStorage` keys `partime_<role>_user` and `partime_<role>_token`), and `sessionStorage` (`partime_tab_active_<role>`, `partime_tab_role`) records which role a tab is using. This lets three roles stay logged in at once in different tabs of one browser. Keep this scheme intact when you change login or logout.

**Cross-tab sync.** `frontend/src/shared/syncEventHub.js` broadcasts entity-change events (`JOBS_SYNC`, `APPLICATIONS_SYNC`, `SHIFTS_SYNC`, `REVIEWS_SYNC`, `PROFILES_SYNC`, `SYSTEM_SYNC`). It uses BroadcastChannel, with a storage-event fallback. After a mutation that other portals display, publish the matching event.

**Realtime.** `Backend/src/core/socket_service.py` runs Socket.IO with `async_mode="threading"` for chat, notifications and WebRTC call signaling. Call rooms are named `room_emp_<emp_id>_stu_<student_user_id>[_app_<app_id>]`, and `canonicalize_room_id` maps profile IDs and user IDs onto that form. Server-side pushes go through `notification_service.emit_socket_event` and `notify_admins`. The client side is `shared/webrtcSocketService.js` and `shared/CallMediaLayer.jsx`.

**Data layer (`Backend/src/core/database.py`).** Routes always call `db_manager.get_collection(name)`, never pymongo directly. At startup the manager pings MongoDB Atlas (`MONGO_URI`, DB `CDTN02_DB`):
- If Atlas is reachable, each collection is wrapped in `AtlasCollectionAdapter`. This adapter keeps an in-RAM mirror and cache, and it offloads large base64 `data:` blobs to GridFS or the inline blob store. Files are referenced as `/api/files/<id>`.
- If Atlas is unreachable, it falls back to `MemoryCollection`/`MemoryGridFS`, which persist to `Backend/local_db_store.json` (git-ignored; the path can be overridden with `PARTIME_LOCAL_DB_PATH`). Query support in this fallback is a hand-written subset of Mongo operators (`_matches_static`). If you add a new query operator, check that it works in both backends.
- Documents use string `_id`s with prefixes such as `user_...`, `emp_...` and `stu_...`, not ObjectIds. `MongoJSONProvider` serializes ObjectIds and dates.

**Auth & security.** `src/core/security.py` contains PBKDF2-HMAC-SHA256 password hashing and a hand-rolled HS256 JWT (it does not use PyJWT). Protect routes with `@role_required("student"|"employer"|"admin")` or `@token_required` from `src/middlewares/auth_middleware.py`. These decorators load the user into `request.current_user` and reject banned users. Business rule BR-AUTH-01: one email can belong to only one role, enforced by `check_email_role_constraint`. Admin accounts cannot self-register; they are inserted directly into the DB. OTP emails are sent by `email_service.py` through the Brevo HTTPS API v3, with Brevo SMTP as a fallback.

**API response shape.** Endpoints return `{"success": bool, "message": str, ...}`. Keep this shape for new endpoints.

## Selenium test suite (`test/`)

Java Page Object Model with TestNG, Apache POI and RestAssured. The suite is data-driven: `PartimeAutomationRunnerTest` reads every test case from `test/TestCases_Selenium_PARTIME_VN.xlsx` through `ExcelTestManager`. Rows with `Run_Mode=NO` are skipped. Each row is dispatched to a page object (`StudentPage`, `EmployerPage`, `AdminPage`, `CrossRoleAndApiHelper`), and the shared WebDriver helpers live in `base/BasePage.java`. Environment settings (`BASE_URL`, `HEADLESS_MODE`, `BROWSER`, `DEMO_SPEED_MS`, …) come from the `Config_Environment` sheet; `-D` system properties override them. Results are written back into the Excel file. If the workbook is open or locked, results go to `target/latest_run_results.json`, and `cleanup_and_sync_excel.bat` syncs them into the workbook later. Login sessions are cached in `test/cookies/` (git-ignored). To add a test case, add a row to the Excel file and a handler in the matching page object.

## Docs

`tailieu/bailam/*.md` holds the project report and specs: business rules and NFR IDs (`dieukienrangbuoc.md`), test scenarios (`kichban.md`), tech mapping (`congnghe.md`), UI design (`thietke.md`) and changelog (`thaydoi.md`). Recent commits keep these documents and `README.md` in sync with code changes.

## Secrets

`Backend/.env` (template: `Backend/.env.example`), `test/cookies/`, `Backend/local_db_store.json` and passwords in the test Excel file must never be committed.
