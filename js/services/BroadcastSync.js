export class BroadcastSync {
    #channel;
    #tabId;
    #onRemoteAction;

    constructor({ onRemoteAction }){
        this.#tabId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        this.#onRemoteAction = onRemoteAction;
        this.#channel = new BroadcastChannel("scribblesync-sync");

        this.#channel.addEventListener("message", (event) => this.handleMessage(event));
    }

    broadcastAction(action){
        const message = {
            type: "ACTION",
            tabId: this.#tabId,
            action: {
                type: action.type,
                payload: action.payload
            }
        };

        this.#channel.postMessage(message);
    }

    handleMessage(event){
        const message = event.data;
        if(!message) return;

        if(message.tabId === this.#tabId) return;

        if(message.type === "ACTION"){
            this.#onRemoteAction(message.action, message.tabId);
        }
    }

    close(){
        this.#channel.close();
    }
}

