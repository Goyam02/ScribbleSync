# ScribbleSync

> **A local-first, infinite-feeling digital workspace built entirely with Vanilla JavaScript.**

ScribbleSync is a browser-based productivity workspace designed around sticky notes, canvas navigation, undo/redo, local persistence, background processing, cross-tab synchronization, notifications, a Pomodoro timer, and asynchronous save management.

The project was intentionally built without React, Vue, Angular, or any other frontend framework. The goal is to demonstrate how modern browser APIs, object-oriented JavaScript, asynchronous programming, and state-management patterns can be combined to build a structured application from scratch.

---

## Table of Contents

- [Overview](#overview)
- [Why ScribbleSync](#why-scribblesync)
- [Features](#features)
- [Architecture](#architecture)
- [System Flow](#system-flow)
- [Project Structure](#project-structure)
- [Core Modules](#core-modules)
- [Data Model](#data-model)
- [State Management](#state-management)
- [Undo and Redo](#undo-and-redo)
- [Persistence](#persistence)
- [Web Workers](#web-workers)
- [Cross-Tab Synchronization](#cross-tab-synchronization)
- [Notifications](#notifications)
- [Authentication Simulation](#authentication-simulation)
- [Pomodoro Timer](#pomodoro-timer)
- [Save Queue](#save-queue)
- [Canvas Interaction Model](#canvas-interaction-model)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Getting Started](#getting-started)
- [How to Use](#how-to-use)
- [Technology Stack](#technology-stack)
- [Design Decisions](#design-decisions)
- [Browser APIs Used](#browser-apis-used)
- [Testing](#testing)
- [Known Limitations](#known-limitations)
- [Project Development Roadmap](#project-development-roadmap)
- [Learning Outcomes](#learning-outcomes)
- [Interview Talking Points](#interview-talking-points)
- [Future Improvements](#future-improvements)
- [License](#license)

---

# Overview

ScribbleSync is a local-first digital workspace where users can create and organize sticky notes on an infinite-feeling canvas.

The application focuses more on **software architecture and browser APIs** than visual complexity.

The main objective was to understand how a real application can be structured around:

- encapsulated application state
- command/action-based history
- generator-driven replay
- browser persistence
- Web Workers
- cross-tab communication
- asynchronous queues
- browser cookies
- browser notifications
- timer-based background functionality

The project is intentionally implemented using plain HTML, CSS, and JavaScript.

---

# Why ScribbleSync?

Many productivity applications hide their underlying architecture behind frameworks and libraries.

ScribbleSync takes the opposite approach.

Instead of relying on a framework abstraction, the application directly uses browser APIs and JavaScript language features to solve specific problems.

For example:

| Problem | Solution |
|---|---|
| Managing notes | `Map` + `CanvasManager` |
| Protecting application state | Private class fields |
| Undo/redo | Action log + inverse actions |
| Step-by-step replay | JavaScript generators |
| Persistent board state | `localStorage` |
| Background serialization | Web Worker |
| Save ordering | Promise-based `SaveQueue` |
| Cross-tab communication | `BroadcastChannel` |
| Background awareness | Notification API |
| Session simulation | Cookies |
| Productivity timing | `setInterval` |

The project therefore serves both as a usable workspace and as a practical exploration of browser-side software architecture.

---

# Features

## Infinite-Feeling Canvas

ScribbleSync provides a large workspace that behaves like an infinite canvas.

Users can:

- pan across the workspace
- zoom in and out
- move notes independently
- work with notes using world coordinates

The application keeps note positions independent of the viewport transform.

---

## Sticky Notes

Notes are represented as JavaScript objects and rendered into the DOM.

Users can:

- create notes
- edit text
- drag notes
- delete notes
- organize notes visually

Example note:

```javascript
{
    id: "note-123456789",
    x: 250,
    y: 180,
    w: 180,
    h: 130,
    text: "Study Java DSA",
    zIndex: 2,
    createdAt: "2026-10-08T10:00:00.000Z"
}
```

---

## Undo and Redo

Every important board mutation is represented as an action.

Supported action types include:

```text
ADD_NOTE
MOVE_NOTE
EDIT_NOTE
DELETE_NOTE
```

Each action stores enough information to reverse itself.

This allows multi-step undo and redo rather than simply storing arbitrary DOM states.

---

## Local Persistence

The board is persisted in `localStorage`.

Refreshing the page does not remove the board.

The application serializes snapshots of the current notes collection and restores those notes when the application starts.

---

## Background Autosave

The autosave worker receives board snapshots and performs JSON serialization away from the main application logic.

The worker communicates with the main thread using:

```javascript
postMessage()
```

and:

```javascript
onmessage
```

The actual `localStorage` operation remains on the main thread.

---

## Multi-Tab Synchronization

Multiple ScribbleSync tabs can communicate using:

```javascript
BroadcastChannel
```

When a local mutation occurs, the action is broadcast to other tabs.

For example:

```text
Tab A
  ↓
ADD_NOTE
  ↓
BroadcastChannel
  ↓
Tab B
  ↓
applyRemoteAction()
```

The receiving tab updates its own state and DOM.

---

## Browser Notifications

When a remote board change arrives while a tab is running in the background, ScribbleSync can display a browser notification.

Notification permission is requested after user interaction rather than automatically when the page loads.

---

## Simulated Authentication

ScribbleSync includes a simple simulated login/session system implemented using:

```javascript
document.cookie
```

The cookie contains:

- a generated session identifier
- an expiration timestamp

The authentication layer supports:

```text
Login
Logout
Session validation
Expiry detection
```

This is intentionally a demonstration of browser cookie mechanics rather than production authentication.

---

## Pomodoro Timer

The application includes a small Pomodoro timer with:

- start
- pause
- reset
- work sessions
- break sessions

The timer uses `setInterval()` for one-second ticks.

A visual progress animation could later use `requestAnimationFrame()` if a progress ring is added.

---

## Promise-Based Save Queue

ScribbleSync uses a Promise chain to ensure save operations execute sequentially.

Instead of:

```text
Save A ────────┐
Save B ─────┐  │
Save C ──┐  │  │
          └──┴──┴── concurrent
```

the queue creates:

```text
Save A
  ↓
Save B
  ↓
Save C
```

This prevents asynchronous persistence operations from racing with each other.

---

# Architecture

ScribbleSync follows a layered architecture.

```text
                              UI
                               |
                               v
                        CanvasManager
                               |
             +-----------------+-----------------+
             |                 |                 |
             v                 v                 v
          #notes         HistoryEngine          DOM
             |                 |
             |                 |
             +--------+--------+
                      |
                      v
                Board Snapshot
                      |
                autosave worker
                      |
                JSON.stringify()
                      |
                      v
                  SaveQueue
                      |
                      v
                 localStorage


CanvasManager
      |
      | local action
      v
BroadcastSync
      |
      v
BroadcastChannel
      |
      +----------------+----------------+
      |                |                |
     Tab A            Tab B            Tab C
                       |
                       v
              applyRemoteAction()


AuthCookieService
      |
      v
document.cookie


PomodoroTimer
      |
      v
setInterval()


NotificationService
      |
      v
Notification API
```

---

# System Flow

## Application Startup

```text
Browser loads homepage
        |
        v
User opens workspace
        |
        v
main.js
        |
        v
CanvasManager created
        |
        v
loadBoard()
        |
        v
localStorage
        |
        v
loadSnapshot()
        |
        v
DOM notes rendered
```

---

## Local Note Mutation

```text
User action
    |
    v
CanvasManager
    |
    +--> #notes
    |
    +--> HistoryEngine
    |
    +--> persist()
    |
    +--> BroadcastSync
```

---

## Autosave

```text
Board mutation
      |
      v
latestSnapshot
      |
      v
Autosave Worker
      |
      v
JSON.stringify()
      |
      v
SAVED message
      |
      v
SaveQueue
      |
      v
saveSerializedBoard()
      |
      v
localStorage
```

---

## Remote Synchronization

```text
Tab A
  |
  v
CanvasManager
  |
  v
BroadcastSync
  |
  v
BroadcastChannel
  |
  v
Tab B
  |
  v
applyRemoteAction()
  |
  +--> #notes
  |
  +--> HistoryEngine
  |
  +--> DOM
  |
  +--> persistence
```

Remote actions are deliberately not broadcast again after being received.

This prevents an infinite synchronization loop.

---

# Project Structure

```text
scribblesync/
│
├── home.html
├── index.html
├── README.md
│
├── css/
│   ├── style.css
│   └── homepage.css
│
├── js/
   │
   ├── main.js
   │
   ├── core/
   │   ├── CanvasManager.js
   │   ├── HistoryEngine.js
   │   ├── SaveQueue.js
   │   └── PomodoroTimer.js
   │
   ├── workers/
   │   ├── autosave.worker.js
   │   └── sync.worker.js
   │
   ├── services/
   │   ├── BroadcastSync.js
   │   ├── NotificationService.js
   │   └── AuthCookieService.js
   │
   └── utils/
       ├── storage.js
       └── idgen.js
```

---

# Core Modules

## `main.js`

Application bootstrap and integration layer.

Responsibilities:

- initialize application modules
- connect UI elements
- create `CanvasManager`
- create workers
- create services
- connect persistence
- connect synchronization
- handle keyboard shortcuts
- manage application lifecycle

`main.js` should primarily coordinate modules rather than contain their internal logic.

---

## `CanvasManager.js`

The central board controller.

Responsibilities:

- create notes
- update notes
- delete notes
- render notes
- load snapshots
- clear board
- handle pointer events
- handle pan and zoom
- communicate board changes
- communicate actions
- apply remote actions

Internal note state is protected using private fields.

```javascript
#notes = new Map();
```

External modules interact through public methods.

---

## `HistoryEngine.js`

Responsible for action history.

Responsibilities:

- store actions
- maintain history cursor
- record new actions
- undo
- redo
- replay actions using generators
- determine whether undo/redo is possible

The history engine is intentionally independent of the DOM.

---

## `SaveQueue.js`

Responsible for sequential asynchronous save operations.

Responsibilities:

- maintain the previous save Promise
- queue new save requests
- preserve execution order
- recover the queue after failures
- optionally flush pending work

---

## `PomodoroTimer.js`

Responsible for timer state.

Responsibilities:

- start
- pause
- reset
- countdown
- work session
- break session
- session transitions
- time formatting

---

## `autosave.worker.js`

Runs independently from the main JavaScript context.

Responsibilities:

- request snapshots
- receive snapshots
- serialize snapshots
- simulate expensive serialization
- notify the main thread when serialization is complete

The worker does not access the DOM or the application's private state.

---

## `sync.worker.js`

Simulates background peer polling.

Responsibilities:

- periodically perform a fake peer check
- generate fake update events
- notify the main thread about simulated remote activity

This worker is intentionally simulated because the project does not use a real backend.

---

## `BroadcastSync.js`

Responsible for communication between browser tabs.

Responsibilities:

- create `BroadcastChannel`
- maintain tab identifier
- broadcast actions
- receive remote actions
- ignore messages produced by the same tab
- close the channel during cleanup

---

## `NotificationService.js`

Responsible for browser notifications.

Responsibilities:

- request notification permission
- determine whether notification is available
- display notifications

---

## `AuthCookieService.js`

Responsible for the simulated authentication session.

Responsibilities:

- create login cookie
- validate session
- determine session expiry
- logout
- clear cookie

---

## `storage.js`

A small wrapper around browser storage.

Responsibilities:

```text
saveBoard()
saveSerializedBoard()
loadBoard()
clearBoard()
```

It also handles:

- JSON serialization
- JSON parsing
- malformed data
- storage errors

---

## `idgen.js`

Contains the project's custom identifier generator.

IDs use a prefix, timestamp, counter, and/or generated component depending on the current implementation.

Example:

```text
note-1758976324512-1
```

---

# Data Model

## Note

The primary note schema is:

```javascript
{
    id,
    x,
    y,
    w,
    h,
    text,
    zIndex,
    createdAt
}
```

### Fields

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique note identifier |
| `x` | number | X position in world coordinates |
| `y` | number | Y position in world coordinates |
| `w` | number | Note width |
| `h` | number | Note height |
| `text` | string | Note contents |
| `zIndex` | number | Rendering order |
| `createdAt` | string | Note creation timestamp |

---

# State Management

ScribbleSync uses a private `Map` inside `CanvasManager`.

```javascript
#notes = new Map();
```

The map uses the note ID as the key:

```text
note ID
   |
   v
Map
   |
   v
note object
```

This provides direct lookup for operations such as:

```javascript
get(id)
set(id, note)
delete(id)
```

The map itself is never returned directly.

Instead, a serializable snapshot is generated:

```javascript
getSnapshot()
```

This preserves encapsulation.

---

# Undo and Redo

ScribbleSync uses an action-based history model.

Example:

```javascript
{
    type: "ADD_NOTE",

    payload: {
        note: {
            ...
        }
    },

    inverse: {
        type: "DELETE_NOTE",

        payload: {
            id: "note-123"
        }
    }
}
```

An action contains:

```text
type
payload
inverse
```

---

## ADD_NOTE

```text
ADD_NOTE
   |
   v
DELETE_NOTE
```

---

## DELETE_NOTE

```text
DELETE_NOTE
      |
      v
ADD_NOTE
```

---

## MOVE_NOTE

```text
Position A
    |
    v
Position B

inverse:

Position B
    |
    v
Position A
```

---

## EDIT_NOTE

```text
"Hello"
   |
   v
"Hello World"

inverse:

"Hello World"
   |
   v
"Hello"
```

---

# History Cursor

The history engine maintains an action array and cursor.

Example:

```text
Actions:

[A] [B] [C] [D]
             ^
           cursor
```

After one undo:

```text
[A] [B] [C] [D]
         ^
       cursor
```

When a new action is performed after undoing:

```text
[A] [B] [E]
         ^
       cursor
```

The invalid redo history is discarded.

This is implemented using the history cursor rather than by storing complete DOM snapshots.

---

# Generators

The history engine contains a generator used for replay.

Conceptually:

```javascript
function* replay(fromIndex, toIndex) {

    ...

    yield action;

}
```

The generator allows actions to be traversed step by step.

This is useful because the same history representation can later support:

- undo
- redo
- replay
- playback
- debugging

The current implementation uses the generator as part of its undo/redo mechanism.

---

# Persistence

ScribbleSync uses `localStorage` for persistent board state.

The board is stored as a JSON snapshot.

Example:

```text
CanvasManager
      |
      v
getSnapshot()
      |
      v
JSON
      |
      v
localStorage
```

On startup:

```text
localStorage
      |
      v
loadBoard()
      |
      v
loadSnapshot()
      |
      v
CanvasManager
```

---

# Storage Responsibilities

`storage.js` isolates browser storage from the rest of the application.

Example API:

```javascript
saveBoard(snapshot);

saveSerializedBoard(serializedSnapshot);

loadBoard();

clearBoard();
```

The wrapper also protects the application against malformed JSON and storage failures.

---

# Web Workers

ScribbleSync uses two workers.

## Autosave Worker

The autosave worker is responsible for serialization.

```text
Main Thread
     |
     | snapshot
     v
Worker
     |
     | JSON.stringify()
     v
serialized snapshot
     |
     v
Main Thread
```

The worker does not directly access `localStorage`.

Instead, it sends the serialized result back to the main thread.

---

## Sync Worker

The sync worker simulates peer update polling.

Every few seconds it can return:

```text
NO_UPDATE
```

or:

```text
PEER_UPDATE
```

This demonstrates worker communication and background processing without requiring a real backend.

---

# Cross-Tab Synchronization

ScribbleSync uses:

```javascript
new BroadcastChannel("scribblesync-sync")
```

Each tab gets its own identifier.

Example:

```text
Tab A → tab-123
Tab B → tab-456
Tab C → tab-789
```

A local action is sent with the originating tab ID.

Example:

```javascript
{
    type: "ACTION",

    tabId: "tab-123",

    action: {
        type: "ADD_NOTE",
        payload: {
            ...
        }
    }
}
```

A receiving tab checks the origin:

```javascript
if (message.tabId === this.#tabId) {
    return;
}
```

This prevents a tab from processing its own broadcast.

---

# Remote Actions

Remote actions enter the board through:

```javascript
applyRemoteAction(action)
```

This is important because synchronization does not duplicate board mutation logic.

Instead:

```text
Remote message
      |
      v
CanvasManager
      |
      v
#applyAction()
      |
      +--> #notes
      +--> DOM
      +--> history
```

This keeps the local and remote state transitions consistent.

---

# Notifications

Notifications are shown when a remote action arrives while the tab is not visible.

The application checks:

```javascript
document.visibilityState
```

before displaying a notification.

The desired behavior is:

```text
Tab B in background

Tab A
  |
  v
Change note
  |
  v
BroadcastChannel
  |
  v
Tab B
  |
  v
Notification
```

Notification permissions are requested after user interaction rather than automatically during page load.

---

# Authentication Simulation

ScribbleSync includes a deliberately simple authentication simulation.

When Login is pressed:

```text
generate session ID
       |
       v
create cookie
       |
       v
store expiry
```

The cookie uses:

```text
max-age
SameSite=Strict
path=/
```

`Secure` would be appropriate in a production HTTPS deployment.

The system supports:

```javascript
login();

isSessionValid();

getExpiryTime();

logout();
```

This feature exists to demonstrate browser cookie mechanics, not to provide real authentication or authorization.

---

# Pomodoro Timer

The timer contains two states:

```text
WORK
BREAK
```

Default durations:

```text
Work  → 25 minutes
Break → 5 minutes
```

The timer uses:

```javascript
setInterval(..., 1000)
```

for its one-second ticks.

Current functionality:

```text
Start
Pause
Reset
Work → Break
Break → Work
```

Timer state is intentionally kept separate from canvas state.

---

# Save Queue

The SaveQueue is implemented using chained Promises.

Conceptually:

```javascript
previousPromise
    .then(() => saveNext());
```

This produces:

```text
Save 1
   ↓
Save 2
   ↓
Save 3
```

rather than starting all operations concurrently.

This matters because asynchronous operations can complete in an order different from the order in which they started.

---

## Example

Suppose:

```text
Save 1 → 1000 ms
Save 2 → 100 ms
Save 3 → 10 ms
```

Without a queue:

```text
Save 3
Save 2
Save 1
```

could complete first.

With the queue:

```text
Save 1
Save 2
Save 3
```

remains the execution order.

---

# Canvas Interaction Model

The workspace consists of two main elements.

```text
#canvas-viewport
        |
        v
#canvas-world
```

The viewport represents the visible window.

The world represents the coordinate system containing notes.

---

## World Coordinates

Notes store:

```javascript
x
y
```

in world coordinates.

Viewport movement is controlled independently through:

```javascript
panX
panY
scale
```

The conversion is conceptually:

```text
screenX = worldX × scale + panX
screenY = worldY × scale + panY
```

and:

```text
worldX = (screenX - panX) / scale
worldY = (screenY - panY) / scale
```

This separation allows panning and zooming without changing the underlying note coordinates.

---

# Pointer Interaction

ScribbleSync uses Pointer Events.

Supported interactions:

```text
Pointer Down
    |
    +--> note header → note drag
    |
    +--> empty canvas → pan


Pointer Move
    |
    +--> update note position
    |
    +--> update canvas transform


Pointer Up
    |
    +--> finish drag
    |
    +--> create MOVE_NOTE history action
```

Dragging from the note header is intentional.

The content area remains available for text editing.

---

# Zoom

Zoom is constrained to a defined range.

The workspace zooms around the mouse pointer rather than simply zooming toward the origin.

This provides a more natural canvas interaction.

---

# Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + Z` / `Cmd + Z` | Undo |
| `Ctrl + Y` / `Cmd + Y` | Redo |

When a contenteditable note is focused, the application allows the browser's native editing shortcuts to operate rather than intercepting them as board-level undo commands.

---

# Getting Started

## Requirements

You only need:

- a modern browser
- a local HTTP server
- a code editor

No package manager or frontend framework is required.

---

## Run with VS Code Live Server

Open the project directory in VS Code.

Then open:

```text
homepage.html
```

and start Live Server.

Navigate to:

```text
http://127.0.0.1:5500/homepage.html
```

or the URL generated by your Live Server extension.

---

## Run with Python

You can also use Python's built-in HTTP server.

From the project root:

```bash
python3 -m http.server 5500
```

Then open:

```text
http://localhost:5500/homepage.html
```

Do not rely on opening the HTML file directly with:

```text
file://
```

because the application uses ES modules, Web Workers, and `BroadcastChannel`, which are better tested through a local HTTP origin.

---

# How to Use

## Open the Workspace

Start at:

```text
homepage.html
```

Click:

```text
Open Workspace
```

This opens:

```text
index.html
```

---

## Create a Note

Click:

```text
Add Note
```

A sticky note appears on the canvas.

---

## Edit a Note

Click inside the editable note area and type.

The content is updated in application state.

---

## Move a Note

Drag the note header.

The note's world coordinates are updated.

---

## Delete a Note

Click the delete button on a note.

The note is removed from:

- the `Map`
- the DOM
- persisted state

---

## Pan

Drag empty space on the canvas.

---

## Zoom

Use the mouse wheel over the workspace.

---

## Undo / Redo

Use the toolbar buttons or keyboard shortcuts.

---

## Cross-Tab Sync

Open ScribbleSync in two browser tabs using the same local server.

For example:

```text
Tab A
http://localhost:5500/index.html

Tab B
http://localhost:5500/index.html
```

Make a change in Tab A.

The corresponding action should appear in Tab B.

---

# Technology Stack

## Languages

- HTML
- CSS
- JavaScript

## JavaScript Features

- ES Modules
- Classes
- Private class fields
- Maps
- Generators
- Promises
- Async/await
- Event handling
- DOM APIs

## Browser APIs

- `localStorage`
- `BroadcastChannel`
- `Worker`
- `Notification`
- `document.cookie`
- Pointer Events
- DOM APIs
- CSS transforms

No external framework or UI library is required.

---

# Design Decisions

## Why Vanilla JavaScript?

The project is intended to demonstrate fundamental JavaScript and browser concepts directly rather than hiding implementation details behind a framework.

---

## Why a `Map` for Notes?

Notes are frequently addressed by ID.

A `Map` provides direct lookup semantics:

```javascript
notes.get(id);
notes.set(id, note);
notes.delete(id);
```

This keeps note operations simple.

---

## Why Private Fields?

The board state belongs to `CanvasManager`.

Without private state, other modules could silently perform mutations such as:

```javascript
canvasManager.notes.clear();
```

Private fields force state changes through controlled APIs.

---

## Why Snapshots?

Returning a snapshot instead of the internal `Map` protects encapsulation.

Persistence also needs a serializable representation.

---

## Why Action-Based History?

Storing complete DOM states for every undo operation would couple history to rendering.

Instead, ScribbleSync records:

```text
what happened
+
information required to reverse it
```

This makes history independent of the DOM.

---

## Why a Web Worker?

Serialization can be separated from the main application execution path.

The worker receives a snapshot and performs:

```javascript
JSON.stringify(snapshot)
```

The project therefore demonstrates message passing and background processing without putting serialization logic directly into the UI flow.

---

## Why localStorage?

The project is local-first and currently does not use a backend.

`localStorage` provides simple persistent browser storage for serialized board snapshots.

---

## Why BroadcastChannel?

Browser tabs have independent JavaScript execution contexts.

`BroadcastChannel` provides a simple browser-native mechanism for sending actions between tabs without a server.

---

## Why Cookies for Session State?

The simulated session is intentionally kept separate from board data.

```text
Cookie
→ session

localStorage
→ application state
```

This demonstrates the distinction between authentication/session information and bulk application state.

---

## Why a Promise Queue?

Asynchronous saves can overlap.

The queue guarantees that save operations execute sequentially.

---

# Browser APIs Used

## Web Worker

Used for background serialization and simulated synchronization.

```javascript
new Worker("./js/workers/autosave.worker.js");
```

---

## BroadcastChannel

Used for cross-tab action propagation.

```javascript
new BroadcastChannel("scribblesync-sync");
```

---

## localStorage

Used to persist board snapshots.

```javascript
localStorage.setItem(...);
localStorage.getItem(...);
```

---

## Notification API

Used for background remote-change notifications.

```javascript
new Notification(...);
```

---

## Cookies

Used for the simulated authentication session.

```javascript
document.cookie
```

---

## Pointer Events

Used for:

- note dragging
- canvas panning
- pointer capture

---

## CSS Transform

Used for:

- canvas panning
- canvas zooming

---

# Testing

The project should be tested at several levels.

## Basic Functionality

```text
Create note
Edit note
Move note
Delete note
```

---

## Persistence

```text
Create notes
Refresh
Verify notes remain
```

---

## Clear Board

```text
Clear Board
Refresh
Verify board is empty
```

---

## Corrupted Storage

Test:

```javascript
localStorage.setItem(
    "scribblesync-board",
    "{ broken json"
);
```

The application should fail gracefully and load an empty board rather than crash.

---

## History

Test:

```text
Add A
Add B
Add C

Undo
Undo

Redo
Redo
```

Also test branching:

```text
Add A
Add B
Add C

Undo
Undo

Add D

Redo
```

`B` and `C` should no longer be available as redo actions after the new branch is created.

---

## Multi-Tab

Open at least two tabs.

Test:

```text
Add
Move
Edit
Delete
Undo
Redo
```

Changes should propagate between tabs.

---

## Save Queue

Use the development test:

```javascript
testSaveQueue();
```

Verify that:

```text
SAVE-1
SAVE-2
SAVE-3
```

complete in that order even when artificial delays differ.

---

## Authentication

Test:

```text
Login
Refresh
Logout
Refresh
Expired session
```

---

## Pomodoro

During development, use short durations such as:

```text
Work: 10 seconds
Break: 5 seconds
```

to verify state transitions quickly.

Restore the normal durations afterward.

---

## Worker Testing

Background the browser tab and observe worker-driven status/log activity.

Browser behavior for background scheduling can vary, so results should be observed rather than assuming workers are completely exempt from browser scheduling policies.

---

# Known Limitations

ScribbleSync is intentionally a v1 educational project.

## History Is Not Persisted

The board survives refresh, but the undo/redo history is currently runtime state.

For example:

```text
Create A
Refresh
Undo
```

will not undo the previous action because the history log starts fresh after reload.

---

## Cross-Tab Conflict Resolution

Concurrent changes to the same note do not use CRDTs, Operational Transformation, Lamport clocks, or another distributed conflict-resolution algorithm.

For example:

```text
Tab A → "Hello A"

Tab B → "Hello B"
```

can result in one update overwriting another depending on ordering.

This is intentionally outside the scope of v1.

---

## Clear Board Synchronization

The current Clear Board operation is treated separately from the normal synchronized note actions and is not a distributed conflict-resolution mechanism.

---

## Simulated Authentication

The authentication system is not real authentication.

There is:

- no backend
- no secure token verification
- no user database
- no authorization system

It exists to demonstrate cookie/session concepts.

---

## Simulated Peer Sync Worker

The sync worker does not connect to a real server.

It generates simulated peer events.

Real network synchronization is represented by `BroadcastChannel` between tabs.

---

## Browser Notification Requirements

Notifications depend on browser support and user permission.

The user must grant notification permission before the application can display browser notifications.

---

## Local Storage Capacity

`localStorage` is intended for relatively small browser-side data.

A larger production workspace would likely use a storage system such as IndexedDB instead.

---

# Project Development Roadmap

The project was developed incrementally over seven days.

## Day 1 — Canvas and Notes

Implemented:

- project structure
- canvas viewport
- sticky notes
- note editing
- note deletion
- note dragging
- canvas panning
- zooming
- note schema

---

## Day 2 — State Encapsulation and Persistence

Implemented:

- private class fields
- private note `Map`
- snapshots
- `localStorage`
- load/hydration
- Clear Board
- corrupted storage handling

The goal was to make the board survive refresh while keeping internal state protected.

---

## Day 3 — History Engine

Implemented:

- action-based mutations
- inverse actions
- action log
- history cursor
- generator replay
- undo
- redo
- keyboard shortcuts

The roadmap defines the core action model around add, move, edit, and delete operations.

---

## Day 4 — Web Workers

Implemented:

- autosave worker
- background serialization
- simulated sync worker
- save status
- worker lifecycle cleanup
- background-tab testing

The objective was to separate background processing from the primary UI path.

---

## Day 5 — Multi-Tab Synchronization

Implemented:

- BroadcastChannel
- tab IDs
- action broadcasting
- remote action application
- notification service
- background remote-change notifications

The roadmap specifically calls for reusing the same CanvasManager mutation/action machinery for remote changes.

---

## Day 6 — Queue, Cookies, and Timer

Implemented:

- SaveQueue
- sequential async saves
- artificial save delay
- cookie session simulation
- login/logout
- Pomodoro timer
- work/break transitions

The roadmap intentionally groups these concepts into the final feature-heavy implementation day.

---

## Day 7 — Integration and Hardening

Implemented:

- full workflow testing
- corrupted storage tests
- expired session tests
- history boundary tests
- branching history tests
- multi-tab tests
- SaveQueue stress tests
- architecture documentation
- design decision documentation
- final README

The final day is focused on integration and edge cases rather than adding unnecessary new features.

---

# Learning Outcomes

ScribbleSync was built to develop practical understanding of:

## JavaScript Architecture

- classes
- modular design
- encapsulation
- state ownership
- separation of concerns

## Asynchronous Programming

- Promises
- async/await
- Promise chaining
- worker messaging

## Browser APIs

- Web Workers
- BroadcastChannel
- localStorage
- cookies
- notifications
- Pointer Events

## State Management

- Maps
- snapshots
- actions
- inverse operations
- cursors
- replay

## Interaction Design

- world coordinates
- screen coordinates
- pan
- zoom
- pointer capture
- editable DOM elements

---

# Interview Talking Points

ScribbleSync can be explained as an architecture-focused JavaScript project.

## Why private fields?

> I wanted CanvasManager to own the board state instead of allowing other modules to mutate the internal Map directly. Public methods act as the controlled interface for state changes.

## Why actions for undo/redo?

> Instead of storing DOM snapshots, every meaningful mutation is represented as an action containing its payload and inverse. That lets HistoryEngine undo and redo state transitions independently of rendering.

## Why generators?

> The history engine exposes a generator that yields actions step by step. This provides a replayable abstraction rather than hard-coding each history traversal.

## Why Web Workers?

> I moved snapshot serialization into a worker so the main application execution path isn't responsible for that work. Communication happens through structured-cloned messages.

## Why BroadcastChannel?

> Separate tabs have independent JavaScript contexts. BroadcastChannel gives them a browser-native communication layer without requiring a backend.

## Why SaveQueue?

> Asynchronous saves can overlap and finish out of order. Chaining each save onto the previous Promise guarantees ordered execution.

## Why localStorage?

> The application is local-first and does not require a backend for its primary board state. localStorage provides simple persistence for the v1 snapshot model.

## What would you change for production?

> I would replace localStorage with IndexedDB for larger datasets, introduce durable history if needed, add proper server-side authentication, implement conflict resolution for concurrent edits, and add a real synchronization backend.

---

# Future Improvements

The project intentionally avoids unnecessary complexity in v1, but possible future improvements include:

## Persistence

- IndexedDB
- persistent history
- versioned board snapshots
- schema migrations

## Collaboration

- real backend synchronization
- WebSocket communication
- conflict resolution
- CRDT-based collaboration

## Canvas

- richer note types
- resizing
- selection
- keyboard movement
- multi-selection
- connectors
- images
- drawing

## Productivity

- task metadata
- reminders
- recurring timers
- workspace templates

## Authentication

- real backend
- secure sessions
- user accounts
- authorization
- server-side validation

## Performance

- rendering optimization
- batching
- snapshot compression
- worker-based diffing
- IndexedDB persistence

---

# Development Philosophy

ScribbleSync follows a deliberate scope rule:

> **Cut visual polish before cutting architectural concepts.**

The primary purpose of the project is to demonstrate:

```text
State
+
Architecture
+
Browser APIs
+
Asynchronous Programming
```

rather than to compete with full-featured collaborative whiteboard products.

The UI is deliberately minimal so the JavaScript architecture remains the primary focus.

---

# Project Status

**Version:** v1

**Architecture:** Browser-only / local-first

**Backend:** None

**Framework:** None

**Primary language:** JavaScript

**Persistence:** `localStorage`

**Cross-tab communication:** `BroadcastChannel`

**Background processing:** Web Workers

**Authentication:** Simulated cookie session

**Synchronization:** Cross-tab + simulated worker sync

---

# Closing

ScribbleSync started as a simple sticky-note canvas and evolved into a small browser architecture experiment.

Its primary value is not the number of features, but the way those features are connected:

```text
CanvasManager
      |
      +--> Private State
      |
      +--> HistoryEngine
      |
      +--> Persistence
      |
      +--> SaveQueue
      |
      +--> Web Workers
      |
      +--> BroadcastChannel
      |
      +--> Notifications
      |
      +--> Timer
      |
      +--> Cookie Session
```

The project demonstrates that a structured, stateful, asynchronous browser application can be built from the platform itself, without relying on an external frontend framework.