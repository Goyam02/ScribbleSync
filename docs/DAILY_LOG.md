
---

# 12. `docs/DAILY_LOG.md`

The roadmap recommends keeping this updated every day rather than writing documentation only at the end. :chatgpt-content-reference{index="6"}

Start it with:

```markdown
# Daily Log

### Day 1 — 2026-09-24

Built:
- Created ScribbleSync project structure.
- Built the initial canvas viewport and workspace.
- Implemented sticky note creation.
- Implemented note editing using contenteditable.
- Implemented note deletion.
- Implemented note dragging using Pointer Events.
- Implemented background panning.
- Implemented cursor-centered zoom.

Concept(s) applied:
- DOM event delegation
- Pointer Events
- CSS transforms
- Object-based state
- World coordinates vs screen coordinates

Bugs hit / how fixed:
- Note dragging could conflict with text editing, so dragging is restricted to the note header.

Decision worth remembering:
- Note positions are stored in world coordinates while pan/zoom is applied to the world container.

Tomorrow:
- Refactor CanvasManager state behind private fields.
- Add localStorage persistence.



---

# 8. Update `DAILY_LOG.md`

```markdown
### Day 2 — 2026-10-03

Built:
- Refactored CanvasManager state into private class fields.
- Added private #notes Map.
- Added private #nextZIndex and #onChange.
- Added localStorage persistence.
- Added board snapshot generation.
- Added board hydration on startup.
- Added Clear Board functionality.
- Added corrupted localStorage handling.

Concept(s) applied:
- Private class fields
- Encapsulation
- Map-based state management
- Serialization with JSON
- localStorage
- Snapshot-based persistence

Bugs hit / how fixed:
- Loaded board was not appearing after refresh because
  loadSnapshot() was receiving the saveBoard function instead
  of the savedBoard returned by loadBoard().

Decision worth remembering:
- CanvasManager owns application state, while storage.js owns
  persistence. The internal Map is never exposed directly.

Tomorrow:
- Build generator-driven undo/redo with HistoryEngine.

[ ] Create HistoryEngine.js
[ ] #actions array
[ ] #cursor
[ ] record()
[ ] replay() generator
[ ] undo()
[ ] redo()
[ ] canUndo()
[ ] canRedo()

[ ] ADD_NOTE history
[ ] DELETE_NOTE history
[ ] MOVE_NOTE history
[ ] EDIT_NOTE history

[ ] Undo button
[ ] Redo button
[ ] Ctrl + Z
[ ] Ctrl + Y

[ ] Multi-step undo
[ ] Multi-step redo
[ ] Branching history test

[ ] ARCHITECTURE.md action-log diagram
[ ] DAILY_LOG.md updated



### Day 4 — 2026-10-04

Built:
- Added autosave Web Worker.
- Moved JSON serialization into the worker.
- Added worker-driven autosave requests.
- Added serialized localStorage saving.
- Added simulated peer-sync worker.
- Added save/sync status indicator.
- Added worker cleanup on page unload.

Concept(s) applied:
- Web Workers
- postMessage / onmessage
- Structured cloning
- Background timer execution
- Worker lifecycle management

Bugs hit / how fixed:
- localStorage is not directly available inside a Web Worker,
  so the worker serializes the snapshot and sends the serialized
  string back to the main thread for storage.

Decision worth remembering:
- Serialization is treated as worker work while browser storage
  remains a main-thread responsibility.

Tomorrow:
- Implement BroadcastChannel cross-tab synchronization.
- Add browser notifications for background sync events.


