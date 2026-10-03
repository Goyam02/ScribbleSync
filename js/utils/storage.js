const STORAGE_KEY = "ss-board";

export function saveBoard(snapshot){
    try{
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
        return true;

    }catch(error){
        console.log("Failed to save board", error);
        return false;
    }

}

export function loadBoard(){
    try{
        const raw = localStorage.getItem(STORAGE_KEY);
        if(!raw) return [];
        const snapshot = JSON.parse(raw);
        if(!Array.isArray(snapshot)){
            console.log("Invalid board data. starting wiht empty board");
            return [];
        }
        return snapshot;
    }catch(error){
        console.log("Failed to load board", error);
        return [];

    }

}

export function clearBoard(){
    try{
        localStorage.removeItem(STORAGE_KEY);
        return true;
    }catch(error){
        console.error("Failed to clear board:", error);;
        return false;
    }
}