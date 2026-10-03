import { CanvasManager } from "./core/CanvasManager.js";
import { saveBoard,loadBoard,clearBoard } from "./utils/storage.js";

const viewport = document.querySelector("#canvas-viewport");

const world = document.querySelector("#canvas-world");

const addNoteButton = document.querySelector("#add-note-btn");

const clearBoardButton = document.querySelector("#clear-board-btn");


function persist(snapshot){
    saveBoard(snapshot);
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
})