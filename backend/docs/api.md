---
title: API
---

# API

- `GET /docs`

  This documentation.
- `GET /app`

  The app. Following query parameters are supported:
    - `view` (required) - Either `table` (overview) or `item` (detail view).
    - `formId` (required) - The id of the form to display.
    - `itemId` (optional) - The id of the form item to display. Only works when `view=item`.
      If omitted, an empty form for creating a new item will be shown.
