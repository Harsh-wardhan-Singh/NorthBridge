# Backend and Database Guide

## Scope
This guide covers the production backend/database integration for the current Flutter frontend in the `frontend` folder.

It includes:
- The data contract expected by the app (Auth, Tasks, Chats, Messages, Voice draft).
- Which frontend files consume/produce each contract.
- How to replace temporary test-data stores with real API + realtime updates.
- A full source inventory for the built frontend under `frontend/lib`.

---

## 1) Current architecture and integration points

### App boot and dependency wiring
- Entry point: `frontend/lib/main.dart`
- Providers initialized at startup:
  - `TaskProvider.loadTasks()`
  - `AuthProvider.loadCurrentUser()`
  - `ChatProvider.loadChats()`

### Layering used in app
- **UI**: `screens/*`, `voice/*`, `widgets/*`
- **State**: `providers/*`
- **Domain models**: `models/*`
- **Data/services**: `services/*`
- **Mock seeds**: `services/test_data/*`

### Where backend API client should live
- `frontend/lib/services/api_service.dart` (currently empty)

Recommended usage:
- Add HTTP methods (`get`, `post`, `patch`, etc.) + auth token injection in `api_service.dart`.
- Call `ApiService` from `auth_service.dart`, `task_service.dart`, `chat_service.dart`.
- Keep providers unchanged as orchestration layer.

---

## 2) Data contracts (what backend must accept/return)

## 2.1 User contract
Used by:
- `frontend/lib/models/user_model.dart`
- `frontend/lib/services/auth_service.dart`
- `frontend/lib/providers/auth_provider.dart`

Required JSON shape:

```json
{
  "id": "string",
  "name": "string",
  "bio": "string",
  "rating": 4.8,
  "tasksDone": 18,
  "location": "string",
  "phoneNumber": "string",
  "email": "string",
  "skills": ["string"],
  "profileImageUrl": "string (URL or data URL)",
  "privatePaymentQrDataUrl": "string (private, owner only)"
}
```

Notes:
- `privatePaymentQrDataUrl` must never be exposed on public-profile endpoints.
- Public profile endpoint should exclude private payment QR.

---

## 2.2 Task contract
Used by:
- `frontend/lib/models/task_model.dart`
- `frontend/lib/models/task_mode.dart`
- `frontend/lib/services/task_service.dart`
- `frontend/lib/providers/task_provider.dart`

Required JSON shape:

```json
{
  "id": "string",
  "postedByUserId": "string",
  "postedByName": "string",
  "title": "string",
  "description": "string",
  "location": "string",
  "price": 250.0,
  "distanceKm": 1.3,
  "scheduledAt": "ISO-8601 datetime",
  "executionMode": "online|offline",
  "acceptedByUserId": "string|null",
  "acceptedAt": "ISO-8601 datetime|null"
}
```

Sorting options expected by UI:

```json
[
  { "type": "default", "label": "Default" },
  { "type": "distance", "label": "Distance" },
  { "type": "closestDate", "label": "Closest Date" },
  { "type": "latestDate", "label": "Latest Date" },
  { "type": "online", "label": "Online" },
  { "type": "offline", "label": "Offline" }
]
```

---

## 2.3 Chat + Message contracts
Used by:
- `frontend/lib/models/chat_model.dart`
- `frontend/lib/models/message_model.dart`
- `frontend/lib/services/chat_service.dart`
- `frontend/lib/providers/chat_provider.dart`
- `frontend/lib/screens/chat/*`

Chat shape:

```json
{
  "chatId": "string",
  "taskId": "string",
  "taskTitle": "string",
  "taskOwnerUserId": "string",
  "taskOwnerName": "string",
  "users": ["string", "string"],
  "lastMessage": { "...Message" }
}
```

Message shape:

```json
{
  "id": "string",
  "chatId": "string",
  "taskId": "string",
  "senderId": "string",
  "text": "string",
  "timestamp": "ISO-8601 datetime",
  "imageDataUrl": "string|null",
  "isPaymentRequest": true
}
```

Notes:
- `imageDataUrl` currently supports base64 data URLs (device-picked image).
- For production, prefer media upload endpoint returning CDN URL, and change model field to `imageUrl`.

---

## 2.4 Voice draft contract
Used by:
- `frontend/lib/models/voice_task_draft_model.dart`
- `frontend/lib/providers/voice_provider.dart`
- `frontend/lib/services/task_service.dart` (`processVoiceInput`)

Expected structured draft payload:

```json
{
  "title": "string",
  "description": "string",
  "location": "string",
  "price": 100.0,
  "scheduledAt": "ISO-8601 datetime",
  "executionMode": "online|offline"
}
```

---

## 3) Endpoint mapping (replace mock logic)

## 3.1 Auth endpoints
Replace in `frontend/lib/services/auth_service.dart`:
- `getCurrentUser()` -> `GET /me`
- `getUserById(userId)` -> `GET /users/:id` (public-safe payload)
- `signInWithCredentials(email,password)` -> `POST /auth/login`
- `signUpWithCredentials(...)` -> `POST /auth/signup`
- `signOutMock()` -> `POST /auth/logout` (or local token clear)
- `updateCurrentUserProfile(...)` -> `PATCH /me/profile`

## 3.2 Task endpoints
Replace in `frontend/lib/services/task_service.dart`:
- `fetchSortOptions()` -> `GET /tasks/sort-options` (or keep static in backend config)
- `fetchTasks(sortBy)` -> `GET /tasks?sort=...`
- `createTask(...)` -> `POST /tasks`
- `acceptTask(taskId,userId)` -> `POST /tasks/:id/accept`
- `processVoiceInput(text)` -> `POST /voice/tasks/parse` (optional server parser)

## 3.3 Chat endpoints
Replace in `frontend/lib/services/chat_service.dart`:
- `fetchChats()` -> `GET /chats`
- `fetchMessages(chatId)` -> `GET /chats/:id/messages`
- `sendMessage(...)` -> `POST /chats/:id/messages`
- `getOrCreateTaskChat(task,helperUserId)` -> `POST /tasks/:id/chats/open`

---

## 4) Realtime integration guide

### Recommended backend capabilities
- Realtime chat messages (WebSocket/Firebase listener/SSE)
- Task acceptance updates
- Profile updates (optional)

### Frontend integration points
- `frontend/lib/providers/chat_provider.dart`
  - Add subscription method (e.g., `subscribeToChat(chatId)`) and update `_messagesState` on incoming events.
- `frontend/lib/providers/task_provider.dart`
  - Add task stream subscription and refresh `_state` when tasks mutate server-side.

### Event payloads
- `chat.message.created`
- `chat.updated`
- `task.updated`

Use same model JSON contracts as above so existing `fromJson` parsers continue to work.

---

## 5) How to remove temporary test data

Temporary data files currently used:
- `frontend/lib/services/test_data/chat_test_data.dart`
- `frontend/lib/services/test_data/message_test_data.dart`
- `frontend/lib/services/test_data/task_test_data.dart`
- `frontend/lib/services/test_data/task_sort_options_test_data.dart`
- `frontend/lib/services/test_data/user_test_data.dart`
- `frontend/lib/services/test_data/voice_input_instructions_test_data.dart`

## Step-by-step migration
1. Implement API client in `frontend/lib/services/api_service.dart`.
2. In each service (`auth_service.dart`, `task_service.dart`, `chat_service.dart`), replace in-memory stores and mock delays with HTTP calls.
3. Keep model parsing (`fromJson`) unchanged where possible.
4. Keep provider APIs unchanged so UI doesn’t need major refactor.
5. Remove `services/test_data/*` imports after endpoints are wired.
6. Keep `voice_input_instructions_test_data.dart` only if you want static policy copy; otherwise fetch from backend moderation/config endpoint.

---

## 6) UI hardcoded-data verification summary

Audit result:
- Domain entities (tasks/chats/messages/users) are **not** hardcoded in UI screens.
- Runtime entity data is read via providers/services/models.
- Temporary domain data currently enters app through service-layer test-data files listed above.

Nuance:
- `frontend/lib/voice/voice_input_screen.dart` reads instruction text from `services/test_data/voice_input_instructions_test_data.dart`.
  - This is still test-data sourced (not inline hardcoded in widget body).

What remains hardcoded in UI by design:
- Static labels/messages (button text, warnings, empty-state copy).

---

## 7) Security and privacy requirements for backend team

- Never expose `privatePaymentQrDataUrl` in public user responses.
- Store media securely (preferred: object storage + signed URLs).
- Validate all message uploads and run moderation checks for image content.
- Keep report-user endpoint auditable:
  - Suggested endpoint: `POST /reports/users`
  - Payload: `{ reporterUserId, targetUserId, reason, chatId, timestamp }`

---

## 8) File-by-file inventory (frontend/lib)

## 8.1 App bootstrap
- `frontend/lib/main.dart`

## 8.2 Core
- `frontend/lib/core/constants/app_spacing.dart`
- `frontend/lib/core/state/view_state.dart`
- `frontend/lib/core/theme/app_theme.dart`
- `frontend/lib/core/utils/date_time_utils.dart`
- `frontend/lib/core/utils/device_image_picker.dart`

## 8.3 Models
- `frontend/lib/models/chat_model.dart`
- `frontend/lib/models/message_model.dart`
- `frontend/lib/models/task_mode.dart`
- `frontend/lib/models/task_model.dart`
- `frontend/lib/models/task_sort_option_model.dart`
- `frontend/lib/models/user_model.dart`
- `frontend/lib/models/voice_capture_result_model.dart`
- `frontend/lib/models/voice_instruction_item_model.dart`
- `frontend/lib/models/voice_task_draft_model.dart`

## 8.4 Providers
- `frontend/lib/providers/auth_provider.dart`
- `frontend/lib/providers/chat_provider.dart`
- `frontend/lib/providers/task_provider.dart`
- `frontend/lib/providers/voice_provider.dart`

## 8.5 Routes
- `frontend/lib/routes/app_routes.dart`

## 8.6 Services
- `frontend/lib/services/api_service.dart` (empty placeholder)
- `frontend/lib/services/auth_service.dart`
- `frontend/lib/services/chat_service.dart`
- `frontend/lib/services/location_service.dart` (empty placeholder)
- `frontend/lib/services/task_service.dart`
- `frontend/lib/services/voice_service.dart`

## 8.7 Service test-data
- `frontend/lib/services/test_data/chat_test_data.dart`
- `frontend/lib/services/test_data/message_test_data.dart`
- `frontend/lib/services/test_data/task_sort_options_test_data.dart`
- `frontend/lib/services/test_data/task_test_data.dart`
- `frontend/lib/services/test_data/user_test_data.dart`
- `frontend/lib/services/test_data/voice_input_instructions_test_data.dart`

## 8.8 Screens
- `frontend/lib/screens/auth/auth_screen.dart`
- `frontend/lib/screens/chat/chat_list_screen.dart`
- `frontend/lib/screens/chat/chat_thread_screen.dart`
- `frontend/lib/screens/home/home_screen.dart`
- `frontend/lib/screens/profile/profile_screen.dart`
- `frontend/lib/screens/profile/public_profile_screen.dart`
- `frontend/lib/screens/task/task_details_screen.dart`
- `frontend/lib/screens/task/task_history_screen.dart`
- `frontend/lib/screens/task/task_post_screen.dart`
- `frontend/lib/screens/task/task_root_screen.dart`
- `frontend/lib/screens/voice/voice_input_screen.dart` (exists but empty)

## 8.9 Voice screens (active)
- `frontend/lib/voice/voice_input_screen.dart`
- `frontend/lib/voice/voice_preview_screen.dart`

## 8.10 Widgets
- `frontend/lib/widgets/app_button.dart`
- `frontend/lib/widgets/app_card.dart`
- `frontend/lib/widgets/app_text_field.dart`
- `frontend/lib/widgets/listening_animation.dart`
- `frontend/lib/widgets/mic_button.dart`
- `frontend/lib/widgets/rating_widget.dart`
- `frontend/lib/widgets/skeleton_box.dart`
- `frontend/lib/widgets/task_card.dart`
- `frontend/lib/widgets/task_card_skeleton.dart`
- `frontend/lib/widgets/user_avatar.dart`
- `frontend/lib/widgets/user_name_with_avatar.dart`

## 8.11 Generated dataconnect files (currently not integrated in app flow)
- `frontend/lib/dataconnect_generated/add_review.dart`
- `frontend/lib/dataconnect_generated/create_movie.dart`
- `frontend/lib/dataconnect_generated/delete_review.dart`
- `frontend/lib/dataconnect_generated/generated.dart`
- `frontend/lib/dataconnect_generated/get_movie_by_id.dart`
- `frontend/lib/dataconnect_generated/list_movies.dart`
- `frontend/lib/dataconnect_generated/list_user_reviews.dart`
- `frontend/lib/dataconnect_generated/list_users.dart`
- `frontend/lib/dataconnect_generated/search_movie.dart`
- `frontend/lib/dataconnect_generated/upsert_user.dart`

---

## 9) Handoff checklist for backend team

- [ ] Implement auth, tasks, chats, messages endpoints with JSON contracts above.
- [ ] Add realtime subscriptions for chat/task updates.
- [ ] Return `executionMode` and all required fields in task responses.
- [ ] Ensure private payment QR is owner-only.
- [ ] Implement user-report endpoint and moderation workflow.
- [ ] Replace test-data imports in services with API calls.
- [ ] Keep provider and model APIs stable to avoid UI regressions.
