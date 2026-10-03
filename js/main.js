import { CanvasManager } from "./core/CanvasManager.js";
import { saveBoard,loadBoard,clearBoard } from "./utils/storage.js";

const viewport = document.querySelector("#canvas-viewport");

const world = document.querySelector("#canvas-world");

const addNoteButton = document.querySelector("#add-note-btn");

const clearBoardButton = document.querySelector("#clear-board-btn");

const undoButton = document.querySelector("#undo-btn");

const redoButton = document.querySelector("#redo-btn");


function persist(snapshot){
    saveBoard(snapshot);
    updateHistoryButtons();

}

const canvasManager =
    new CanvasManager(
        viewport,
        world,
        {
            onChange: persist
        }
    );


const savedBoard = loadBoard();
canvasManager.loadSnapshot(savedBoard);



addNoteButton.addEventListener("click", () => {

    canvasManager.addNote();

});

clearBoardButton.addEventListener("click", () =>{
    canvasManager.clear();
    clearBoard();
});

undoButton.addEventListener("click", () =>{
    canvasManager.undo();
});
redoButton.addEventListener("click", () =>{
    canvasManager.redo();
});

function updateHistoryButtons(){
    undoButton.disabled = !canvasManager.canUndo();
    redoButton.disabled = !canvasManager.canRedo();

}
