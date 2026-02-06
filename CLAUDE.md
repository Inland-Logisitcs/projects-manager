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

## Frontend Testing and Debugging

**PREFERRED APPROACH**: For frontend tasks, testing, and debugging UI issues, always use the MCP Playwright browser tools instead of just reading code. This allows you to:
- Verify that implementations work correctly in the actual browser
- Debug visual issues, layout problems, and interactive behaviors
- Test user flows end-to-end
- Investigate bugs by reproducing them in real-time
- Validate that UI components render and function as expected

**Login Credentials**: When you need to log in to test authenticated features, use the credentials from the `.env` file

**Testing Workflow**:
1. Start the dev server with `npm run dev` if not already running
2. Use MCP Playwright tools to navigate to `http://localhost:3000`
3. Log in using the credentials above
4. Test the feature or investigate the issue interactively
5. Take snapshots or screenshots to document findings
6. Make code changes based on what you observe
7. Verify the fixes work by testing again in the browser

**When to Use MCP Playwright**:
- After implementing new UI features (verify they work)
- When debugging visual or interaction issues
- To investigate reported bugs
- To test responsive behavior
- To validate form submissions and user flows
- To check accessibility and user experience

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

### Component Organization
Components are organized by domain/functionality in a modular structure:

```
src/components/
├── common/          # Reusable UI components (Icon, Toast, ConfirmDialog, UserAvatar, UserSelect)
├── editors/         # Rich text and content editors (RichTextEditor)
├── files/           # File handling components (AttachmentsList, PdfViewer)
├── kanban/          # Kanban board components (KanbanBoard, KanbanCard, KanbanColumn, ColumnManager, TaskDetailSidebar)
├── layout/          # Layout components (MainLayout, Sidebar)
├── modals/          # Modal dialogs (CreateUserModal)
├── routing/         # Route guards (ProtectedRoute, AdminRoute)
├── tables/          # Table components (Table, TableActions)
└── timeline/        # Gantt timeline (GanttTimeline)
```

**When creating new components:**
1. Place in the appropriate domain folder (create new folder if needed)
2. Use PascalCase for component files (e.g., `MyComponent.jsx`)
3. Create corresponding CSS file in `src/styles/` if component-specific styles are needed
4. Prefer using utility classes over custom CSS (see Design System below)

### Core Data Flow
1. **Real-time subscriptions**: All data syncing uses Firestore's `onSnapshot` for real-time updates
2. **Service layer pattern**: Business logic is centralized in `src/services/`:
   - [taskService.js](src/services/taskService.js) - Task CRUD, archiving, sprint assignment
   - [sprintService.js](src/services/sprintService.js) - Sprint lifecycle management
   - [columnService.js](src/services/columnService.js) - Dynamic Kanban columns with default initialization
   - [storageService.js](src/services/storageService.js) - File uploads (images, PDFs, attachments)
   - [projectService.js](src/services/projectService.js) - Projects for Gantt view
   - [userService.js](src/services/userService.js) - User profile management and role updates
3. **Optimistic updates**: UI updates immediately before Firebase confirms changes (see [KanbanBoard.jsx](src/components/kanban/KanbanBoard.jsx#L28))

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
The project uses a **modular utility-first CSS system** (similar to Tailwind) located in [src/styles/utilities/](src/styles/utilities/). **ALWAYS use utility classes instead of writing custom CSS or inline styles.**

#### Available Utility Modules

**[buttons.css](src/styles/utilities/buttons.css)** - Button styles
```jsx
<button className="btn btn-primary">Primary</button>
<button className="btn btn-secondary">Secondary</button>
<button className="btn btn-danger">Delete</button>
<button className="btn btn-primary btn-sm">Small</button>
<button className="btn btn-primary btn-lg">Large</button>
<button className="btn btn-icon"><Icon name="x" /></button>
```

**[typography.css](src/styles/utilities/typography.css)** - Text styles
```jsx
<h1 className="heading-1 text-primary">Main Title</h1>
<h2 className="heading-2 text-secondary">Subtitle</h2>
<p className="text-base">Regular text</p>
<p className="text-sm text-secondary">Small secondary text</p>
<p className="text-xs text-tertiary">Extra small tertiary</p>
<span className="font-bold">Bold text</span>
<span className="font-medium">Medium weight</span>
```

**[forms.css](src/styles/utilities/forms.css)** - Form elements
```jsx
<div className="form-group">
  <label className="label">Name *</label>
  <input type="text" className="input" />
</div>

<div className="form-group">
  <label className="label">Description</label>
  <textarea className="textarea" rows={3}></textarea>
</div>

<select className="select">
  <option>Option 1</option>
</select>
```

**[layout.css](src/styles/utilities/layout.css)** - Layout utilities
```jsx
// Flexbox
<div className="flex items-center justify-between gap-base">
<div className="flex flex-col gap-sm">

// Grid
<div className="grid grid-cols-2 gap-base">

// Spacing (xs, sm, base, md, lg, xl, 2xl, 3xl, 4xl)
<div className="p-base">Padding all sides</div>
<div className="px-lg py-sm">Padding x and y</div>
<div className="m-base">Margin all sides</div>
<div className="mb-lg">Margin bottom</div>
<div className="gap-sm">Gap between flex/grid children</div>

// Border utilities
<div className="border-b-light">Bottom border</div>
<div className="border-t-medium">Top border</div>
```

**[cards.css](src/styles/utilities/cards.css)** - Card components
```jsx
<div className="card">
  <div className="card-header">Header</div>
  <div className="card-body">Content</div>
  <div className="card-footer">Footer</div>
</div>
```

**[badges.css](src/styles/utilities/badges.css)** - Status badges
```jsx
<span className="badge badge-primary">Primary</span>
<span className="badge badge-success">Success</span>
<span className="badge badge-warning">Warning</span>
<span className="badge badge-error">Error</span>
<span className="badge badge-priority-high">High Priority</span>
```

**[modals.css](src/styles/utilities/modals.css)** - Modal dialogs
```jsx
<div className="modal-overlay" onClick={onClose}>
  <div className="modal-content" onClick={e => e.stopPropagation()}>
    <h3 className="modal-header">Title</h3>
    <p className="text-base text-secondary mb-base">Content</p>
    <div className="modal-footer flex justify-end gap-sm">
      <button className="btn btn-secondary">Cancel</button>
      <button className="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

**[misc.css](src/styles/utilities/misc.css)** - Miscellaneous utilities
```jsx
<div className="empty-state">
  <div className="spinner"></div>
  <p>Loading...</p>
</div>

<div className="divider"></div>
<div className="avatar">JD</div>
```

#### Design Tokens
All design tokens are defined in [variables.css](src/styles/variables.css):

**Colors:**
- `--color-primary`, `--color-accent`, `--color-success`, `--color-warning`, `--color-error`
- `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-inverse`
- `--bg-primary`, `--bg-secondary`, `--bg-tertiary`
- `--border-light`, `--border-medium`, `--border-dark`

**Spacing:** `--space-xs` (0.25rem), `--space-sm` (0.5rem), `--space-base` (1rem), `--space-md` (1.5rem), `--space-lg` (2rem), `--space-xl` (3rem), `--space-2xl` (4rem), `--space-3xl` (6rem), `--space-4xl` (8rem)

**Typography:** `--font-xs` (0.75rem), `--font-sm` (0.875rem), `--font-base` (1rem), `--font-lg` (1.125rem), `--font-xl` (1.25rem), etc.

**Shadows:** `--shadow-sm`, `--shadow-base`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`

**Border radius:** `--radius-sm`, `--radius-base`, `--radius-md`, `--radius-lg`

#### Best Practices

**✅ DO: Use utility classes**
```jsx
// Good - uses utilities
<div className="flex items-center justify-between gap-base p-lg border-b-light">
  <h2 className="heading-2 text-primary">Title</h2>
  <button className="btn btn-primary">Action</button>
</div>
```

**❌ DON'T: Write inline styles**
```jsx
// Bad - inline styles
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '2rem', borderBottom: '1px solid var(--border-color)' }}>
  <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Title</h2>
  <button style={{ background: '#015E7C', padding: '0.625rem 1rem' }}>Action</button>
</div>
```

**✅ DO: Combine utilities**
```jsx
// Good - composing utilities
<div className="card">
  <div className="flex justify-between items-center p-base border-b-light">
    <h3 className="heading-3 text-primary">Card Title</h3>
    <button className="btn btn-icon"><Icon name="x" /></button>
  </div>
  <div className="p-base">
    <p className="text-base text-secondary mb-sm">Content here</p>
  </div>
</div>
```

**When to create component-specific CSS:**
Only create custom CSS in `src/styles/[ComponentName].css` for:
- Complex positioning (fixed, absolute, sticky)
- Custom animations and transitions
- Library-specific styles (react-pdf, gantt-task-react, tiptap)
- Complex pseudo-elements (::before, ::after)
- Media queries with component-specific behavior
- Styles that can't be achieved with utilities

**Example of good component-specific CSS:**
```css
/* MyComponent.css - only unique styles */
.my-component-special {
  position: sticky;
  top: 0;
  z-index: 100;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
```

**Migration status:** 100% of components have been migrated to use utilities where applicable (see [CSS_MIGRATION.md](CSS_MIGRATION.md)).

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
