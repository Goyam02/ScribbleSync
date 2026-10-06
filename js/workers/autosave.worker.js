let latestSnapshot = [];
let saveCounter = 0;

setInterval(() => {
    self.postMessage({
        type: "REQUEST_SNAPSHOT"
    });
}, 5000);

self.onmessage = (event) => {
    const message = event.data;

    if(message.type === "SNAPSHOT"){
        latestSnapshot = message.snapshot;
        serializeSnapshot();
    }
};

function serializeSnapshot(){
    const requestId = ++saveCounter;
    const serializedSnapshot = JSON.stringify(latestSnapshot);

    setTimeout(() => {
        self.postMessage({
            type: "SAVED",
            requestId,
            serializedSnapshot,
            timestamp: new Date().toISOString()
        });
    }, 200);
}