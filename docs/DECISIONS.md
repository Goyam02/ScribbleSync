## Day 5 — Cross-Tab Synchronization

ScribbleSync uses BroadcastChannel to distribute board actions
between tabs of the same origin.

Only the action type and payload are transmitted. The inverse
action remains local history state.

Each tab has a unique tab identifier so a tab can ignore its own
BroadcastChannel messages.

Remote actions are applied through CanvasManager instead of
having separate synchronization logic. The remote action is also
recorded in local history so the receiving tab can undo it.

### Multi-Tab Conflict Limitation

The v1 implementation does not provide a global conflict
resolution algorithm.

If multiple tabs modify the same note at approximately the same
time, updates are applied according to message arrival/order.

This means concurrent edits can overwrite one another.

CRDTs, operational transforms, or a distributed conflict
resolution mechanism are intentionally outside the scope of v1.

