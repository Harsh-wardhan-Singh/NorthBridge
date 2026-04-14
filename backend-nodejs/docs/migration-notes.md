# Migration Notes

## Goal

Recreate the legacy TypeScript backend behavior in a Node.js structure without changing the Flutter frontend.

## What is already aligned

- Route names and method coverage match the frontend feature set.
- The user, task, chat, message, and voice draft field names match the Dart models.
- The legacy mock dataset has a direct home in `mock-data/seed-data.js`.

## What remains intentionally deferred

- No runtime implementation has been written in the new Node.js scaffold yet.
- The `scripts` folder stays empty for now by request.
- The Flutter frontend still uses in-memory mock services, so the backend can be prepared independently.

## Compatibility rules to keep

- Do not rename contract fields without updating the frontend models later.
- Keep response objects shaped to the current frontend expectations.
- Keep seed data IDs stable so the existing preview UI continues to match the mock chats and tasks.

## Files in scope for later implementation

- `src/routes`
- `src/controllers`
- `src/services`
- `src/repositories`
- `src/triggers`
- `mock-data/seed-data.js`
