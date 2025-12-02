# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Guidelines

**IMPORTANT**:
- Do NOT create documentation files (*.md, README files, usage guides, etc.) unless explicitly requested by the user. Focus on writing functional code only.
- NEVER use emojis in code, comments, console logs, or user-facing messages.
- NEVER use native JavaScript alerts (`alert()`, `confirm()`, `prompt()`). Instead, use the platform's integrated UI components:
  - For notifications: Use the [Toast](src/components/Toast.jsx) component
  - For confirmations: Use the [ConfirmDialog](src/components/ConfirmDialog.jsx) component
  - For user input: Create custom modal dialogs

## Project Overview

Sync Projects is a Kanban-based project management application built with React and Firebase. The app features sprint management, drag-and-drop task organization, rich text editing, file attachments, and a Gantt timeline view.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (available at http://localhost:3000)
npm run dev

# Build for production (outputs to dist/)
npm run build

# Preview production build
npm run preview
```

## Firebase Configuration

### Database Setup
This application uses a **specific Firebase database** called `sync-projects` (not the default database). This is configured in [src/config/firebase.js](src/config/firebase.js#L22).

### Required Environment Variables
Create a `.env` file in the root directory with these variables (see `.env.example`):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Firestore Collections and Rules
The app uses these Firestore collections:
- `tasks` - Task items with status, priority, sprints, attachments, and rich text descriptions
- `sprints` - Sprint planning with start/end dates and goals
- `projects` - Projects for Gantt timeline view
- `columns` - Kanban board columns (customizable)
- `users` - User profiles with roles (admin/user) for access control

**IMPORTANT**: Whenever Firebase security rules need to be updated or created, always write them to the [firestore.rules](firestore.rules) file in the root directory. This file contains the complete Firestore security rules configuration that must be deployed to Firebase Console. All operations require authenticated users.

### User Management and Roles
Users cannot self-register. Create users manually in Firebase Console > Authentication > Users. The app includes a role-based access control system:
- **Users (role: 'user')**: Standard access to tasks, sprints, and projects
- **Admins (role: 'admin')**: Full access including user management via `/users` page
- User profiles are auto-created on first login with 'user' role

## Architecture

### Core Data Flow
1. **Real-time subscriptions**: All data syncing uses Firestore's `onSnapshot` for real-time updates
2. **Service layer pattern**: Business logic is centralized in `src/services/`:
   - [taskService.js](src/services/taskService.js) - Task CRUD, archiving, sprint assignment
   - [sprintService.js](src/services/sprintService.js) - Sprint lifecycle management
   - [columnService.js](src/services/columnService.js) - Dynamic Kanban columns with default initialization
   - [storageService.js](src/services/storageService.js) - File uploads (images, PDFs, attachments)
   - [projectService.js](src/services/projectService.js) - Projects for Gantt view
   - [userService.js](src/services/userService.js) - User profile management and role updates
3. **Optimistic updates**: UI updates immediately before Firebase confirms changes (see [KanbanBoard.jsx](src/components/KanbanBoard.jsx#L28))

### Routing Structure
The app uses React Router with protected routes wrapped in [MainLayout](src/components/MainLayout.jsx):
- `/login` - Authentication page
- `/dashboard` - Kanban board for the **active sprint only**
- `/backlog` - Sprint planning and task backlog (tasks with `sprintId: null`)
- `/projects` - Gantt timeline view
- `/archived` - Archived tasks (soft delete)
- `/users` - User management table (admin only, protected by [AdminRoute](src/components/AdminRoute.jsx))

### Sprint System
- **Sprint states**: `planned`, `active`, `completed`
- **Only one active sprint** at a time
- Tasks with `sprintId: null` are in the backlog
- Dashboard shows only tasks from the active sprint
- Starting a sprint moves it from `planned` to `active`
- Completing a sprint moves incomplete tasks back to backlog

### Kanban Columns
- Columns are **dynamic and stored in Firestore** (`columns` collection)
- Default columns auto-initialize on first load via [initializeDefaultColumns()](src/services/columnService.js#L47)
- Default IDs: `pending`, `in-progress`, `qa`, `completed`
- Users can add/remove/reorder columns via [ColumnManager](src/components/ColumnManager.jsx)

### Drag and Drop
Uses `@dnd-kit` library with custom collision detection:
- **Column-first collision**: Prioritizes dropping on columns over cards (see [customCollisionDetection](src/components/KanbanBoard.jsx#L85))
- Tasks can be dragged between Kanban columns (changes `status`)
- Tasks can be dragged between sprints and backlog (changes `sprintId`)
- Card reordering within columns updates the `order` field

### Task Details Sidebar
[TaskDetailSidebar](src/components/TaskDetailSidebar.jsx) provides:
- Rich text editor using TipTap (supports formatting, links, images, task lists)
- File attachments with preview support
- PDF viewer for uploaded PDFs
- Movement history tracking (`movementHistory` array)
- Status change timestamps (`lastStatusChange`, `previousStatus`)

### File Storage
- Images: Limited to 5MB, stored at `tasks/{taskId}/images/`
- Attachments: Limited to 10MB, stored at `tasks/{taskId}/attachments/`
- Metadata stored in task document's `attachments` array
- File deletion removes both Firestore metadata and Storage file

### Reusable Components

**[Table](src/components/Table.jsx)**: Generic table component for displaying tabular data
- Supports custom cell rendering via `renderCell` prop
- Built-in filtering system (global search + column-specific filters)
- Loading states, empty states, and error handling
- Column configuration with `filterOptions` for dropdowns
- Currently used in: Users page, Archived Tasks page

**[TableActions](src/components/TableActions.jsx)**: Generic action buttons for table rows
- Configurable actions with icons, labels, variants, and onClick handlers
- Multiple variants: primary, secondary, success, warning, danger, info, ghost
- Sizes: small, medium, large
- Layouts: horizontal, vertical
- Currently used in: Users page (role toggle), Archived Tasks page (restore/delete)

## Key Implementation Details

### Task Schema
Tasks include these notable fields:
- `archived` (boolean) - Soft delete flag
- `sprintId` (string|null) - Sprint association (null = backlog)
- `status` (string) - Column ID from `columns` collection
- `order` (number) - Position within column
- `movementHistory` (array) - Status change log
- `attachments` (array) - File metadata
- `description` (string) - Rich text HTML from TipTap editor

### Column Initialization
On app load, [columnService.js](src/services/columnService.js) checks if `columns` collection is empty and creates defaults. Always query columns from Firestore rather than hardcoding.

### Authentication Context
[AuthContext](src/contexts/AuthContext.jsx) provides:
- `user` - Current Firebase Auth user or null
- `userProfile` - Firestore user document with role and profile data
- `isAdmin` - Boolean indicating if user has admin role
- `loading` - Initial auth state check
- `login(email, password)` - Returns `{ success, user }` or `{ success: false, error }`
- `logout()` - Signs out user

The context automatically creates a user profile document on first login with default 'user' role.

### Error Handling
Services provide detailed console errors with Firebase error codes:
- `permission-denied` - Check Firestore rules
- `failed-precondition` - Database not created
- `unavailable` - Network issues

See [taskService.js](src/services/taskService.js#L144) for example error handling patterns.

## Design System

### CSS Utilities System
The project uses a **modular utility-first CSS system** located in [src/styles/utilities/](src/styles/utilities/). Always use utility classes instead of writing custom CSS when possible.

**Available utility modules:**
- **[buttons.css](src/styles/utilities/buttons.css)** - Button styles (`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-icon`, etc.)
- **[typography.css](src/styles/utilities/typography.css)** - Text styles (`.heading-1`, `.heading-2`, `.text-base`, `.text-sm`, `.font-bold`, etc.)
- **[forms.css](src/styles/utilities/forms.css)** - Form elements (`.input`, `.select`, `.textarea`, `.form-group`, etc.)
- **[layout.css](src/styles/utilities/layout.css)** - Layout utilities (`.flex`, `.grid`, `.gap-base`, `.p-md`, `.mb-lg`, etc.)
- **[cards.css](src/styles/utilities/cards.css)** - Card components (`.card`, `.card-header`, `.card-body`, `.card-footer`, etc.)
- **[badges.css](src/styles/utilities/badges.css)** - Status badges (`.badge`, `.badge-primary`, `.badge-priority-high`, etc.)
- **[modals.css](src/styles/utilities/modals.css)** - Modal dialogs (`.modal-overlay`, `.modal-content`, `.modal-header`, etc.)
- **[misc.css](src/styles/utilities/misc.css)** - Miscellaneous (`.empty-state`, `.spinner`, `.divider`, `.avatar`, etc.)

All utilities are imported via [utilities.css](src/styles/utilities.css) which is loaded in [index.css](src/styles/index.css).

**Design tokens** are defined in [variables.css](src/styles/variables.css):
- Colors: `--color-primary`, `--color-success`, `--color-error`, etc.
- Spacing: `--space-xs`, `--space-sm`, `--space-base`, `--space-md`, `--space-lg`, etc.
- Typography: `--font-sm`, `--font-base`, `--font-lg`, `--font-weight-medium`, etc.
- Shadows: `--shadow-sm`, `--shadow-base`, `--shadow-md`, `--shadow-lg`, etc.
- Radius: `--radius-sm`, `--radius-base`, `--radius-md`, `--radius-lg`, etc.

**Examples:**
```jsx
// ❌ DON'T write custom CSS
<button style={{ background: '#015E7C', padding: '0.625rem 1rem' }}>Save</button>

// ✅ DO use utility classes
<button className="btn btn-primary">Save</button>

// ❌ DON'T write custom CSS for common layouts
<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>...</div>

// ✅ DO use utility classes
<div className="flex gap-base items-center">...</div>
```

**Component-specific CSS** should only be used for unique component styles that can't be achieved with utilities. Store these in `src/styles/[ComponentName].css`.

## Common Patterns

### Creating a new service
1. Define collection name constant
2. Export CRUD functions with error handling
3. Use `serverTimestamp()` for timestamps
4. Return `{ success, ... }` objects
5. Provide `subscribe*` functions for real-time data

### Adding new task fields
1. Update task schema in [taskService.js](src/services/taskService.js#L19)
2. Update Firestore rules if field is required
3. Consider adding to [TaskDetailSidebar](src/components/TaskDetailSidebar.jsx)

### Working with drag and drop
- Use `@dnd-kit` components: `DndContext`, `Droppable`, `Draggable`
- Implement optimistic updates before Firebase calls
- Track pending updates to prevent snapshot overwrites
