import { CanvasManager } from "./core/CanvasManager.js";
import { loadBoard, clearBoard, saveSerializedBoard } from "./utils/storage.js";
import { NotificationService } from "./services/NotificationService.js";
import { BroadcastSync } from "./services/BroadcastSync.js";
import { SaveQueue } from "./core/SaveQueue.js";
import { AuthCookieService } from "./services/AuthCookieService.js";
import { PomodoroTimer } from "./core/PomodoroTimer.js";

const viewport = document.querySelector("#canvas-viewport");
const world = document.querySelector("#canvas-world");
const addNoteButton = document.querySelector("#add-note-btn");
const clearBoardButton = document.querySelector("#clear-board-btn");
const undoButton = document.querySelector("#undo-btn");
const redoButton = document.querySelector("#redo-btn");
const saveStatus = document.querySelector("#save-status");

/*
 * ---------------- SAVE QUEUE ----------------
 */
const saveQueue = new SaveQueue(async (serializedSnapshot) => {
    // Artificial delay to simulate an expensive save operation.
    await new Promise((resolve) => setTimeout(resolve, 300));

    return saveSerializedBoard(serializedSnapshot);
});

/*
 * ---------------- WORKERS ----------------
 */
const autosaveWorker = new Worker("./js/workers/autosave.worker.js");
const syncWorker = new Worker("./js/workers/sync.worker.js");

/*
 * ---------------- SERVICES ----------------
 */
const notificationService = new NotificationService();
const authCookieService = new AuthCookieService();

/*
 * ---------------- AUTH UI ----------------
 */
const loginButton = document.querySelector("#login-btn");
const logoutButton = document.querySelector("#logout-btn");
const sessionStatus = document.querySelector("#session-status");

/*
 * ---------------- TIMER UI ----------------
 */
const timerLabel = document.querySelector("#timer-label");
const timerDisplay = document.querySelector("#timer-display");
const timerStartButton = document.querySelector("#timer-start");
const timerResetButton = document.querySelector("#timer-reset");

/*
 * ---------------- TIMER ----------------
 */
const pomodoroTimer = new PomodoroTimer({
    onTick: (remainingSeconds) => {
        timerDisplay.textContent = pomodoroTimer.getDisplayTime();
    },
    onSessionChange: (sessionType) => {
        timerLabel.textContent = sessionType;
    }
});

timerStartButton.addEventListener("click", () => {
    if (pomodoroTimer.isRunning()) {
        pomodoroTimer.pause();
        timerStartButton.textContent = "Start";
    } else {
        pomodoroTimer.start();
        timerStartButton.textContent = "Pause";
    }
});

timerResetButton.addEventListener("click", () => {
    pomodoroTimer.reset();
    timerStartButton.textContent = "Start";
    timerDisplay.textContent = pomodoroTimer.getDisplayTime();
});

/*
 * ---------------- SAVE QUEUE TEST ----------------
 */
async function testSaveQueue() {
    console.log("Starting SaveQueue test...");

    const testQueue = new SaveQueue(async (value) => {
        const delay = Math.floor(Math.random() * 1000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        console.log("Finished:", value, "after", delay, "ms");
        return value;
    });

    testQueue.enqueue("SAVE-1").then((result) => {
        console.log("Resolved:", result);
    });

    testQueue.enqueue("SAVE-2").then((result) => {
        console.log("Resolved:", result);
    });

    testQueue.enqueue("SAVE-3").then((result) => {
        console.log("Resolved:", result);
    });
}

// Make test available from console.
window.testSaveQueue = testSaveQueue;

/*
 * ---------------- STATE ----------------
 */
let broadcastSync = null;
let latestSnapshot = [];

/*
 * ---------------- SESSION STATUS ----------------
 */
function updateSessionStatus() {
    if (!authCookieService.isSessionValid()) {
        sessionStatus.textContent = "Logged out";
        return;
    }

    const expiresAt = authCookieService.getExpiryTime();
    const expiryTime = new Date(expiresAt).toLocaleTimeString();
    sessionStatus.textContent = `Logged in until ${expiryTime}`;
}

loginButton.addEventListener("click", () => {
    authCookieService.login();
    updateSessionStatus();
});

logoutButton.addEventListener("click", () => {
    authCookieService.logout();
    updateSessionStatus();
});

updateSessionStatus();

/*
 * ---------------- HISTORY BUTTONS ----------------
 */
function updateHistoryButtons() {
    undoButton.disabled = !canvasManager.canUndo();
    redoButton.disabled = !canvasManager.canRedo();
}

/*
 * ---------------- PERSIST ----------------
 */
function persist(snapshot) {
    latestSnapshot = snapshot;
    saveStatus.textContent = "Waiting for auto-save...";
    updateHistoryButtons();
}

/*
 * ---------------- CANVAS MANAGER ----------------
 */
const canvasManager = new CanvasManager(viewport, world, {
    onChange: persist,
    onAction: (action) => {
        // Broadcast local action to other tabs.
        broadcastSync?.broadcastAction(action);
    }
});

/*
 * ---------------- LOAD BOARD ----------------
 */
const savedBoard = loadBoard();
canvasManager.loadSnapshot(savedBoard);
latestSnapshot = canvasManager.getSnapshot();
updateHistoryButtons();

/*
 * ---------------- BROADCAST SYNC ----------------
 */
broadcastSync = new BroadcastSync({
    onRemoteAction: (action, tabId) => {
        console.log("Remote action:", action);
        console.log("From tab:", tabId);

        const success = canvasManager.applyRemoteAction(action);

        if (success && document.visibilityState !== "visible") {
            notificationService.notify("ScribbleSync", {
                body: "Another tab changed the board."
            });
        }
    }
});

/*
 * ---------------- NOTIFICATION PERMISSION ----------------
 */
document.addEventListener(
    "pointerdown",
    () => {
        notificationService.requestPermission();
    },
    { once: true }
);

/*
 * ---------------- ADD NOTE ----------------
 */
addNoteButton.addEventListener("click", () => {
    canvasManager.addNote();
});

/*
 * ---------------- CLEAR BOARD ----------------
 */
clearBoardButton.addEventListener("click", () => {
    canvasManager.clear();
    clearBoard();
    latestSnapshot = [];
    saveStatus.textContent = "Board cleared";
    updateHistoryButtons();
});

/*
 * ---------------- AUTOSAVE WORKER ----------------
 */
autosaveWorker.addEventListener("message", (event) => {
    const message = event.data;

    if (message.type === "REQUEST_SNAPSHOT") {
        autosaveWorker.postMessage({
            type: "SNAPSHOT",
            snapshot: latestSnapshot
        });
        return;
    }

    if (message.type === "SAVED") {
        /*
         * IMPORTANT:
         * Don't save directly. Put the operation inside SaveQueue.
         */
        saveQueue
            .enqueue(message.serializedSnapshot)
            .then((success) => {
                if (success) {
                    const savedTime = new Date(message.timestamp).toLocaleTimeString();
                    saveStatus.textContent = `Saved ${savedTime}`;
                } else {
                    saveStatus.textContent = "Save failed";
                }
            })
            .catch((error) => {
                console.error("Save queue error:", error);
                saveStatus.textContent = "Save failed";
            });
    }
});

/*
 * ---------------- SYNC WORKER ----------------
 */
syncWorker.addEventListener("message", (event) => {
    const message = event.data;

    if (message.type === "NO_UPDATE") {
        console.log("No peer updates");
        saveStatus.textContent = "Checking for updates...";
    }

    if (message.type === "PEER_UPDATE") {
        console.log(message.message);
        saveStatus.textContent = "Peer update detected";
    }
});

/*
 * ---------------- KEYBOARD SHORTCUTS ----------------
 */
document.addEventListener("keydown", (event) => {
    const activeElement = document.activeElement;
    const isEditing =
        activeElement?.isContentEditable ||
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA";

    // Let the browser handle text editing shortcuts.
    if (isEditing) return;

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        canvasManager.undo();
        updateHistoryButtons();
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        canvasManager.redo();
        updateHistoryButtons();
    }
});

/*
 * ---------------- HISTORY BUTTONS ----------------
 */
undoButton.addEventListener("click", () => {
    canvasManager.undo();
    updateHistoryButtons();
});

redoButton.addEventListener("click", () => {
    canvasManager.redo();
    updateHistoryButtons();
});

/*
 * ---------------- CLEANUP ----------------
 */
window.addEventListener("beforeunload", () => {
    autosaveWorker.terminate();
    syncWorker.terminate();
    broadcastSync?.close();
});