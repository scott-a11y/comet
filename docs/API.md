# 🔌 External API Documentation

This document outlines the public-facing API endpoints for the Comet Shop Layout Tool. All endpoints require authentication via Clerk unless otherwise specified.

## Base URL
`/api`

---

## 🏗️ Buildings

### `GET /api/buildings`
Returns a list of all shop buildings.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Main Shop",
    "widthFt": 40,
    "depthFt": 60
  }
]
```

### `GET /api/buildings/[id]`
Returns detailed information for a specific building, including its layouts.

---

## ⚙️ Equipment

### `GET /api/equipment`
Returns the equipment catalog.

### `POST /api/equipment`
Adds a new equipment definition to the database.

**Body:**
```json
{
  "name": "CNC Router",
  "category": "MACHINERY",
  "widthFt": 5,
  "depthFt": 10
}
```

---

## 🗺️ Layouts

### `GET /api/layouts/[id]`
Returns the full spatial data for a specific layout, including wall positions and MEP routing.

---

## 🛠️ Utility

### `GET /api/health`
Checks the connection to the Database and external services.

---

## 🔒 Security & Rate Limiting
- **Authentication:** Bearer tokens via Clerk.
- **Rate Limit:** 100 requests per minute per IP (enforced via Upstash Redis).
