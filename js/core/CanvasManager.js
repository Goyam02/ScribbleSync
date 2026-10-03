import { generateId } from "../utils/idgen.js";

export class CanvasManager {
    #notes;
    #nextZIndex;
    #onChange;

    constructor(viewport, world, options = {}) {
        this.viewport = viewport;
        this.world = world;

        this.#notes = new Map();
        this.#nextZIndex = 1;

        this.#onChange = options.onChange ?? (() => {});

        this.panX = viewport.clientWidth / 2;
        this.panY = viewport.clientHeight / 2;

        this.scale = 1;

        this.activeInteraction = null;

        this.bindEvents();
        this.updateWorldTransform();
    }

    // Notifies the application that board state changed.
    #notifyChange() {
        this.#onChange(this.getSnapshot());
    }

    // Binds all canvas events.
    bindEvents() {
        this.viewport.addEventListener(
            "pointerdown",
            (event) => this.handlePointerDown(event)
        );

        this.viewport.addEventListener(
            "pointermove",
            (event) => this.handlePointerMove(event)
        );

        this.viewport.addEventListener(
            "pointerup",
            (event) => this.handlePointerUp(event)
        );

        this.viewport.addEventListener(
            "pointercancel",
            (event) => this.handlePointerUp(event)
        );

        this.viewport.addEventListener(
            "wheel",
            (event) => this.handleWheel(event),
            { passive: false }
        );
    }

    addNote() {
        console.log("note added");

        const rect =
            this.viewport.getBoundingClientRect();

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const worldPosition =
            this.screenToWorld(
                centerX,
                centerY
            );

        const offset =
            (this.#notes.size % 8) * 25;

        const note = {
            id: generateId(),

            x: worldPosition.x - 90 + offset,
            y: worldPosition.y - 65 + offset,

            w: 180,
            h: 130,

            text: "Double-click to edit",

            zIndex: this.#nextZIndex++,

            createdAt: new Date().toISOString()
        };

        this.#notes.set(
            note.id,
            note
        );

        this.renderNote(note);

        this.#notifyChange();

        return note;
    }

    updateNote(id, changes) {
        console.log("update note");

        const note =
            this.#notes.get(id);

        if (!note) {
            return null;
        }

        Object.assign(
            note,
            changes
        );

        this.#notifyChange();

        return note;
    }

    deleteNote(id) {
        console.log("note deleted");

        const note =
            this.#notes.get(id);

        if (!note) {
            return false;
        }

        this.#notes.delete(id);

        const element =
            this.world.querySelector(
                `[data-note-id="${id}"]`
            );

        element?.remove();

        this.#notifyChange();

        return true;
    }

    // Returns a copy of all notes.
    getSnapshot() {
        return Array.from(
            this.#notes.values()
        ).map((note) => ({
            ...note
        }));
    }

    // Loads notes from localStorage snapshot.
    loadSnapshot(snapshot) {

        if (!Array.isArray(snapshot)) {
            return;
        }

        this.#notes.clear();

        this.world.innerHTML = "";

        let highestZIndex = 0;

        snapshot.forEach((savedNote) => {

            const note = {
                id: savedNote.id,
                x: savedNote.x,
                y: savedNote.y,
                w: savedNote.w,
                h: savedNote.h,
                text: savedNote.text,
                zIndex: savedNote.zIndex,
                createdAt: savedNote.createdAt
            };

            this.#notes.set(
                note.id,
                note
            );

            highestZIndex = Math.max(
                highestZIndex,
                note.zIndex
            );

            this.renderNote(note);
        });

        this.#nextZIndex =
            highestZIndex + 1;
    }

    // Clears all notes from the board.
    clear() {

        this.#notes.clear();

        this.world.innerHTML = "";

        this.#nextZIndex = 1;

        this.#notifyChange();
    }

    screenToWorld(screenX, screenY) {
        return {
            x:
                (screenX - this.panX) /
                this.scale,

            y:
                (screenY - this.panY) /
                this.scale
        };
    }

    renderNote(note) {

        const noteElement =
            document.createElement("div");

        noteElement.className =
            "sticky-note";

        // Stores note id inside the DOM element.
        noteElement.dataset.noteId =
            note.id;

        noteElement.style.left =
            `${note.x}px`;

        noteElement.style.top =
            `${note.y}px`;

        noteElement.style.width =
            `${note.w}px`;

        noteElement.style.height =
            `${note.h}px`;

        noteElement.style.zIndex =
            note.zIndex;

        noteElement.innerHTML = `
            <div class="note-header">

                <span class="note-title">
                    Note
                </span>

                <button
                    class="delete-note"
                    title="Delete note"
                    aria-label="Delete note"
                >
                    *
                </button>

            </div>

            <div
                class="note-content"
                contenteditable="true"
                spellcheck="false"
            ></div>
        `;

        const contentElement =
            noteElement.querySelector(
                ".note-content"
            );

        contentElement.textContent =
            note.text;

        // Event listener for editing.
        contentElement.addEventListener(
            "input",
            () => {

                this.updateNote(
                    note.id,
                    {
                        text:
                            contentElement.textContent
                    }
                );

            }
        );

        const deleteButton =
            noteElement.querySelector(
                ".delete-note"
            );

        deleteButton.addEventListener(
            "click",
            () => {

                this.deleteNote(note.id);

            }
        );

        this.world.appendChild(
            noteElement
        );

        return noteElement;
    }

    handlePointerDown(event) {

        if (event.button !== 0) {
            return;
        }

        const target = event.target;

        const noteElement =
            target.closest(".sticky-note");

        if (noteElement) {

            const header =
                target.closest(".note-header");

            if (
                !header ||
                target.closest(".delete-note")
            ) {
                return;
            }

            const noteId =
                noteElement.dataset.noteId;

            const note =
                this.#notes.get(noteId);

            if (!note) {
                return;
            }

            this.activeInteraction = {

                type: "note-drag",

                noteId,

                startX: event.clientX,
                startY: event.clientY,

                originalX: note.x,
                originalY: note.y
            };

            noteElement.classList.add(
                "active"
            );

            noteElement.setPointerCapture(
                event.pointerId
            );

            return;
        }

        this.activeInteraction = {

            type: "pan",

            startX: event.clientX,
            startY: event.clientY,

            originalPanX: this.panX,
            originalPanY: this.panY
        };

        this.viewport.classList.add(
            "is-panning"
        );

        this.viewport.setPointerCapture(
            event.pointerId
        );
    }

    handlePointerMove(event) {

        const interaction =
            this.activeInteraction;

        if (!interaction) {
            return;
        }

        const deltaX =
            event.clientX -
            interaction.startX;

        const deltaY =
            event.clientY -
            interaction.startY;

        if (
            interaction.type ===
            "note-drag"
        ) {

            const note =
                this.#notes.get(
                    interaction.noteId
                );

            if (!note) {
                return;
            }

            note.x =
                interaction.originalX +
                deltaX / this.scale;

            note.y =
                interaction.originalY +
                deltaY / this.scale;

            const noteElement =
                this.world.querySelector(
                    `[data-note-id="${note.id}"]`
                );

            if (noteElement) {

                noteElement.style.left =
                    `${note.x}px`;

                noteElement.style.top =
                    `${note.y}px`;
            }

            return;
        }

        if (
            interaction.type ===
            "pan"
        ) {

            this.panX =
                interaction.originalPanX +
                deltaX;

            this.panY =
                interaction.originalPanY +
                deltaY;

            this.updateWorldTransform();
        }
    }

    handlePointerUp(event) {

        const interaction =
            this.activeInteraction;

        if (!interaction) {
            return;
        }

        if (
            interaction.type ===
            "note-drag"
        ) {

            const noteElement =
                this.world.querySelector(
                    `[data-note-id="${interaction.noteId}"]`
                );

            noteElement?.classList.remove(
                "active"
            );

            // Save only once when dragging ends.
            this.#notifyChange();
        }

        this.activeInteraction = null;

        this.viewport.classList.remove(
            "is-panning"
        );
    }

    handleWheel(event) {

        event.preventDefault();

        const rect =
            this.viewport.getBoundingClientRect();

        const mouseX =
            event.clientX - rect.left;

        const mouseY =
            event.clientY - rect.top;

        const worldBeforeZoom =
            this.screenToWorld(
                mouseX,
                mouseY
            );

        const zoomFactor =
            event.deltaY < 0
                ? 1.1
                : 0.9;

        const newScale =
            Math.min(
                2.5,
                Math.max(
                    0.4,
                    this.scale *
                    zoomFactor
                )
            );

        this.scale =
            newScale;

        this.panX =
            mouseX -
            worldBeforeZoom.x *
            this.scale;

        this.panY =
            mouseY -
            worldBeforeZoom.y *
            this.scale;

        this.updateWorldTransform();
    }

    updateWorldTransform() {

        this.world.style.transform =
            `matrix(
                ${this.scale},
                0,
                0,
                ${this.scale},
                ${this.panX},
                ${this.panY}
            )`;
    }
}