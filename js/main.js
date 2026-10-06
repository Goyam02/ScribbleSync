import { CanvasManager } from "./core/CanvasManager.js";
import { loadBoard, clearBoard, saveSerializedBoard } from "./utils/storage.js";
import { NotificationService } from "./services/NotificationService.js";
import { BroadcastSync } from "./services/BroadcastSync.js";

const viewport = document.querySelector("#canvas-viewport");
const world = document.querySelector("#canvas-world");
const addNoteButton = document.querySelector("#add-note-btn");
const clearBoardButton = document.querySelector("#clear-board-btn");
const undoButton = document.querySelector("#undo-btn");
const redoButton = document.querySelector("#redo-btn");
const saveStatus = document.querySelector("#save-status");

const autosaveWorker = new Worker("./js/workers/autosave.worker.js");
const syncWorker = new Worker("./js/workers/sync.worker.js");
const notificationService = new NotificationService();
let broadcastSync = null;
let latestSnapshot = [];

function persist(snapshot){
    latestSnapshot = snapshot;
    saveStatus.textContent = "Waiting for auto-save...";
    updateHistoryButtons();
}

const canvasManager = new CanvasManager(viewport, world, {
    onChange: persist,
    onAction: (action) => {
        broadcastSync?.broadCastAction(action);
    }
});

broadcastSync =
    new BroadcastSync({

        onRemoteAction:
            (action, tabId) => {

                const success =
                    canvasManager
                        .applyRemoteAction(
                            action
                        );

                if (
                    success &&
                    document.visibilityState !==
                        "visible"
                ) {

                    notificationService.notify(
                        "ScribbleSync",
                        {
                            body:
                                "A remote tab changed the board."
                        }
                    );
                }
            }
    });


const savedBoard = loadBoard();
canvasManager.loadSnapshot(savedBoard);
latestSnapshot = canvasManager.getSnapshot();
updateHistoryButtons();

addNoteButton.addEventListener("click", () => {
    canvasManager.addNote();
});

clearBoardButton.addEventListener("click", () => {
    canvasManager.clear();
    clearBoard();
    latestSnapshot = [];
    saveStatus.textContent = "Board cleared";
});

autosaveWorker.addEventListener("message", (event) => {
    const message = event.data;

    if(message.type === "REQUEST_SNAPSHOT"){
        autosaveWorker.postMessage({
            type: "SNAPSHOT",
            snapshot: latestSnapshot
        });
        return;
    }

    if(message.type === "SAVED"){
        const success = saveSerializedBoard(message.serializedSnapshot);

        if(success){
            const savedTime = new Date(message.timestamp).toLocaleTimeString();
            saveStatus.textContent = `Saved ${savedTime}`;
        }else{
            saveStatus.textContent = "Save failed";
        }
    }
});

syncWorker.addEventListener("message", (event) => {
    const message = event.data;

    if(message.type === "NO_UPDATE"){
        console.log("No peer updates");
        saveStatus.textContent = "Checking for updates...";
    }

    if(message.type === "PEER_UPDATE"){
        console.log(message.message);
        saveStatus.textContent = "Peer update detected";
    }
});

window.addEventListener(
    "beforeunload",
    () => {

        autosaveWorker.terminate();

        syncWorker.terminate();
        broadcastSync?.close();

    }
);

function updateHistoryButtons() {

    undoButton.disabled =
        !canvasManager.canUndo();

    redoButton.disabled =
        !canvasManager.canRedo();
}


document.addEventListener(
    "keydown",
    (event) => {

        const activeElement =
            document.activeElement;

        const isEditing =
            activeElement?.isContentEditable ||
            activeElement?.tagName === "INPUT" ||
            activeElement?.tagName === "TEXTAREA";

        if (isEditing) {
            return;
        }

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "z"
        ) {

            event.preventDefault();

            canvasManager.undo();

            updateHistoryButtons();
        }

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "y"
        ) {

            event.preventDefault();

            canvasManager.redo();

            updateHistoryButtons();
        }
    }
);

undoButton.addEventListener(
    "click",
    () => {

        canvasManager.undo();

        updateHistoryButtons();
    }
);


redoButton.addEventListener(
    "click",
    () => {

        canvasManager.redo();

        updateHistoryButtons();
    }
);
document.addEventListener(
    "pointerdown",
    () => {

        notificationService
            .requestPermission();

    },
    {
        once: true
    }
);