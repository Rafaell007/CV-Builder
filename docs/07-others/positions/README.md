# Positions Page

> **Group:** Others · **Source:** CV Builder Wiki Frontend (Notion)

![Positions Page preview](./preview.png)

## Purpose

Allows administrators to manage positions used within the application.

Administrators can:

- View positions
- Search positions
- Sort positions
- Create positions
- Edit positions
- Delete positions

---

## Scope

This page is available only to users with the Admin role.

Users without Admin permissions must not have access to this page.

---

## Behavior

The page allows administrators to:

- View a paginated list of positions
- Search positions by name
- Sort positions by name
- Create new positions
- Edit existing positions
- Delete positions
- Navigate through pages of results

---

## Navigation

### Sidebar Navigation

Requirements:

- The Positions navigation item must be visible only for Admin users
- Selecting Positions opens the Positions page
- The active navigation item must be visually highlighted

---

## Design Reference

Figma: CV Builder – Positions

---

## Layout

- Page follows the standard application layout
- Sidebar navigation remains visible
- Position list is displayed in the content area
- Supports Light and Dark themes
- Fully responsive on desktop and tablet devices

---

## Content

### Page Header

Title: Positions

Requirements:

- Display page title above the position list

---

### Create Position Action

Button: CREATE POSITION

Requirements:

- Visible only to Admin users
- Opens the Create Position modal
- Includes default, hover, pressed and disabled states

---

### Search

Search field: Search

Requirements:

- Allows searching positions by name
- Search results update after entering a search value
- Search must be case-insensitive
- Search must work across all positions

---

### Sorting

Column: Name

Requirements:

- Positions can be sorted alphabetically
- Supports ascending and descending order
- Active sort direction must be visually indicated

---

### Positions Table

Columns:

- Name
- Actions

Requirements:

- Display position name
- Display action menu for each position
- Rows must remain readable across supported themes

---

### Row Actions

Action menu:

- Edit
- Delete

Requirements:

- Menu opens when clicking the actions icon
- Only one action menu can be opened at a time
- Menu closes when:
  - user clicks outside
  - action is selected

---

## Create Position Modal

Title: Create position

Fields:

- Position

Requirements:

- Position name is required
- Position name must be unique
- Modal includes CREATE and CANCEL

Behavior:

- CREATE creates a new position
- CANCEL closes the modal without saving

Validation examples:

- Position name is required
- Position already exists

---

## Edit Position Modal

Title: Edit position

Fields:

- Position

Requirements:

- Current position name is prefilled
- Position name is required
- Position name must be unique

Actions:

- SAVE
- CANCEL

Behavior:

- SAVE updates position data
- CANCEL closes the modal without saving

---

## Delete Position Modal

Title: Delete position

Message: Are you sure you want to delete position {Position Name}?

Requirements:

- Position name must be displayed in the confirmation message
- Modal includes CONFIRM and CANCEL

Behavior:

- CONFIRM permanently deletes the position
- CANCEL closes the modal without deleting
- Positions assigned to employees, departments, projects, or other system entities cannot be deleted

---

## Pagination

Requirements:

- Position list must support pagination
- Pagination is displayed when multiple pages exist
- User can navigate between pages
- Current page must be visually indicated

---

## Validation & Error Handling

- Position name is required
- Duplicate position names are not allowed
- Positions that are referenced by other entities cannot be deleted
- Validation messages must be displayed inline when possible
- Failed requests must not clear entered values
- Server errors must display a user-friendly error message

Example messages:

- Position name is required
- Position already exists
- Position cannot be deleted because it is currently in use
- Something went wrong. Please try again later

---

## Accessibility & Responsiveness

- Full keyboard navigation support is required
- Interactive elements must provide visible focus states
- Modal dialogs must trap keyboard focus while open
- Text must remain readable in all supported themes
- Layout and controls must scale correctly across supported screen sizes

---

## Acceptance Criteria

| ID | Description |
| --- | --- |
| AC-1 | Positions page is accessible only to Admin users |
| AC-2 | Positions navigation item is visible only to Admin users |
| AC-3 | Position list displays position names |
| AC-4 | Search filters positions by name |
| AC-5 | Positions can be sorted by name in ascending and descending order |
| AC-6 | Position list supports pagination |
| AC-7 | CREATE POSITION button opens the Create Position modal |
| AC-8 | New positions can be created successfully |
| AC-9 | Position names must be unique |
| AC-10 | Action menu is available for each position |
| AC-11 | Existing positions can be edited |
| AC-12 | Existing positions can be deleted through confirmation modal |
| AC-13 | Positions assigned to other entities cannot be deleted |
| AC-14 | Validation messages are displayed for invalid input |
| AC-15 | User-friendly error messages are displayed for failed requests |
| AC-16 | Page supports Light and Dark themes |
| AC-17 | Page is responsive across supported devices |
