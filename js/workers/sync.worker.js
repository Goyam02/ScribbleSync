let checkCount = 0;

setInterval(() => {
    checkCount++;

    const hasUpdate = Math.random() < 0.3;

    if(hasUpdate){
        self.postMessage({
            type: "PEER_UPDATE",
            message: `Fake peer update detected (check ${checkCount})`,
            timestamp: new Date().toISOString()
        });
    }else{
        self.postMessage({
            type: "NO_UPDATE",
            timestamp: new Date().toISOString()
        });
    }
}, 5000);