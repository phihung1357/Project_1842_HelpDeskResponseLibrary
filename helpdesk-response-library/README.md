# Helpdesk Response Library

This project follows the COMP1842 CRUD lecture structure and adapts it to the
coursework case study.

## Structure

- `server` contains the Express and MongoDB CRUD API.
- `front-end` contains the Vue 2 application.

## Main Coursework Features

- CRUD system adapted to a helpdesk response library
- Third field added: `department`
- Professional support field added: `priority`
- Additional staff context fields: `tags` and `notes`
- Backend-authenticated register/login flow with role-based access
- New menu item and page: `Staff Quiz`
- New dashboard landing page with recent activity and urgent queue
- Additional feature: search and department filtering on the entries page
- Additional feature: priority filtering, sorting, and one-click copy actions
- Additional feature: archive and restore workflow with audit-friendly timestamps
- Additional feature: audit history timeline for each entry
- Additional feature: paginated entry list for larger datasets
- Additional feature: export filtered entries as JSON or CSV
- Duplicate issue code validation

## Running the Project

1. Start MongoDB locally.
2. The default MongoDB connection string is `mongodb://127.0.0.1:27017/helpdesk_db`.
3. In `server`, run `npm install`, then `npm run seed` if you want sample data, then `npm run start`.
4. In `front-end`, run `npm install`, then `npm run serve`.
5. Open `http://localhost:8080`.

## Authentication

- New registrations are created with the default `Staff` role.
- A seeded admin account is created by `npm run seed`:
  - username: `admin`
  - password: `Admin1842!`
- A seeded staff account is also created:
  - username: `staff_demo`
  - password: `Staff1842!`
