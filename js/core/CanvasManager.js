import { generateId } from "../utils/idgen.js";

export class CanvasManager{

    constructor(viewport, world){
        this.viewport = viewport;
        this.world = world;

        this.notes = new Map();
        this.nextZIndex = 1;

        this.panX = viewport.clientWidth /2;
        this.panY = viewport.clientHeight / 2;
        this.scale = 1;

        this.activeInteraction = null;

        this.bindEvents();
        this.updateWorldTransform();

    }

    // need to clear the working to bindevents

    bindEvents(){
        this.viewport.addEventListener(
            "pointerDown",
            (event) => this.handlePointerDown(event)
        );
        this.viewport.addEventListener(
            "pointerMove",
            (event) => this.handlePointerDown(event)
        );
        this.viewport.addEventListener(
            "pointerup",
            (event) => this.handlePointerDown(event)
        );
        this.viewport.addEventListener(
            "pointercancel",
            (event) => this.handlePointerDown(event),
            { passive: false }
        );        

    }

    addNote(){
        console.log("note added");
        const rect = this.viewport.getBoundingClientRect();

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;


        const worldPosition = this.screenToWorld(
            centerX,
            centerY
        );


        const offset = (this.notes.size % 8) * 25;
        const note = {
            id: generateId(),
            x: worldPosition.x - 90 + offset,
            y: worldPosition.y - 65 + offset,
            w: 180,
            h: 130,
            text: "Double-click to edit",
            zIndex: this.nextZIndex++,
            createdAt: new Date().toISOString()
        };

        this.notes.set(note.id, note);
        this.renderNote(note);
        return note;

    }

    updateNote(id, changes){

        console.log("update note")

        const note = this.notes.get(id);

        if(!note){
            return null;
        }

        Object.assign(note, changes);

        return note;
    }

    deleteNote(id){
        const note = this.notes.get(id);

        if(!note) return false;
        this.notes.delete(id);

        const element = this.world.querySelector(
            `[data-note-id="${id}"]`
        );

        element?.remove();
        return true;
    }

    screenToWorld(screenX, screenY){

        return{
            x: (screenX - this.panX) / this.scale,
            y: (screenY - this.panY) / this.scale
        };
    }

    renderNote(note){

        const noteElement = document.createElement("div");

        noteElement.className = "sticky-note";
        // what is .dataset for??
        noteElement.dataset.noteId= note.id;

        noteElement.style.left = `${note.x}px`;
        noteElement.style.top = `${note.y}px`;
        noteElement.style.width = `${note.w}px`;
        noteElement.style.height = `${note.h}px`;

        noteElement.style.zIndex = note.zIndex;

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

        const contentElement = noteElement.querySelector(".note-content");
        contentElement.textContent = note.text;


            //eventlisteners working
        contentElement.addEventListener("input", () => {
            this.updateNote(note.id, {
                text: contentElement.textContent
            });
            }
        );
    
        const deleteButton = noteElement.querySelector(".delete-note")
        deleteButton.addEventListener("click", () =>{
            this.deleteNote(note.id);
        });

        this.world.appendChild(noteElement);

        return noteElement;
 
    }

    handlePointerDown(event){
        if (event.button !== 0) {
            return;
        }

        const target = event.target;

        const noteElement = target.closest(".sticky-note");

        if(noteElement){

            const header = target.closest(".note-header");

            if(!header || target.closest(".delete-note")){
                return;
            }

            const noteId = noteElement.dataset.noteId;

            const note = this.notes.get(noteId);

            if(!note){
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

            noteElement.classList.add("active");

            noteElement.setPointerCapture(event.pointerId);

            return;
        }    

    this.activeInteraction = {
            type: "pan",
            startX: event.clientX,
            startY: event.clientY,
            originalPanX: this.panX,
            originalPanY: this.panY
        };

    this.viewport.classList.add("is-panning");

    this.viewport.setPointerCapture(event.pointerId);


    }

    handlePointerMove(event){

        const interaction = this.activeInteraction;

        if(!interaction){
            return;
        }

        const deltaX = event.clientX - interaction.startX;
        const deltaY = event.clientY - interaction.startY;


        if(interaction.type === "note-drag"){
            this.panX = interaction.originalPanX + deltaX;
            this.panY = interaction.originalPanY + deltaY;

            this.updateWorldTransform();
        }
    }

    handlePointerUp(event) {

        if (
            this.activeInteraction?.type === "note-drag"
        ) {

            const noteElement =
                this.world.querySelector(
                    `[data-note-id="${this.activeInteraction.noteId}"]`
                );

            noteElement?.classList.remove("active");
        }

        this.activeInteraction = null;

        this.viewport.classList.remove("is-panning");
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
            this.screenToWorld(mouseX, mouseY);

        const zoomFactor =
            event.deltaY < 0 ? 1.1 : 0.9;

        const newScale =
            Math.min(
                2.5,
                Math.max(
                    0.4,
                    this.scale * zoomFactor
                )
            );

        this.scale = newScale;

        this.panX =
            mouseX -
            worldBeforeZoom.x * this.scale;

        this.panY =
            mouseY -
            worldBeforeZoom.y * this.scale;

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