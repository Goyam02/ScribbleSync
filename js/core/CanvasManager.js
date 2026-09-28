import { generateId } from "../utils/idgen";

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

    bindEvents(){
        this.viewport.addEventListener(
            "pointerDown",
            (event) => this.handlePointerDown(event);
        );
        this.viewport.addEventListener(
            "pointerMove",
            (event) => this.handlePointerDown(event);
        );
        this.viewport.addEventListener(
            "pointerup",
            (event) => this.handlePointerDown(event);
        );
        this.viewport.addEventListener(
            "pointercancel",
            (event) => this.handlePointerDown(event);
            { passive: false }
        );        

    }

    addNote(){
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
}