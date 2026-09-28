import { CanvasManager } from "./core/CanvasManager.js";

const viewport = document.querySelector("#canvas-viewport");

const world = document.querySelector("#canvas-world");

const addNoteButton = document.querySelector("#add-note-btn");

const canvasManager =
    new CanvasManager(
        viewport,
        world
    );

addNoteButton.addEventListener("click", () => {

    canvasManager.addNote();

});