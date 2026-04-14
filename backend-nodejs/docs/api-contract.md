# NorthBridge API Contract

This document defines the backend contract the Flutter frontend expects.

## Core data shapes

### User

- `id`: string
- `name`: string
- `rating`: number
- `location`: string

### Task

- `id`: string
- `postedByUserId`: string
- `postedByName`: string
- `title`: string
- `description`: string
- `location`: string
- `price`: number
- `distanceKm`: number
- `scheduledAt`: ISO-8601 string

### Chat

- `chatId`: string
- `taskId`: string
- `taskTitle`: string
- `taskOwnerUserId`: string
- `taskOwnerName`: string
- `users`: string[]
- `lastMessage`: Message

### Message

- `id`: string
- `chatId`: string
- `taskId`: string
- `senderId`: string
- `text`: string
- `timestamp`: ISO-8601 string

### Voice task draft

- `title`: string
- `description`: string
- `location`: string
- `price`: number
- `scheduledAt`: ISO-8601 string

## Expected routes

### Auth and users

- `GET /v1/users`
- `GET /v1/auth/me`
- `POST /v1/auth/login`
- `POST /v1/auth/signup`
- `POST /v1/auth/logout`

### Tasks

- `GET /v1/tasks`
- `GET /v1/tasks/:taskId`
- `POST /v1/tasks`
- `POST /v1/tasks/:taskId/accept`

### Chats

- `GET /v1/chats`
- `GET /v1/chats/:chatId/messages`
- `POST /v1/chats/:chatId/messages`

### Voice

- `POST /v1/voice/parse-task`

## Frontend compatibility notes

- The Flutter models parse `rating`, `price`, and `distanceKm` as numeric values and convert them to doubles.
- All date fields must remain ISO-8601 strings because the frontend uses `DateTime.parse`.
- Chat payloads must include a nested `lastMessage` object.
- The frontend currently uses mocked service classes, so no live HTTP wiring exists yet.
