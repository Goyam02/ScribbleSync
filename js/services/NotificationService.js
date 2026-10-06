export class NotificationService {
    #permission = "default";

    constructor(){
        if("Notification" in window){
            this.#permission = Notification.permission;
        }
    }

    async requestPermission(){
        if(!("Notification" in window)) return false;

        if(Notification.permission === "granted"){
            this.#permission = "granted";
            return true;
        }

        const permission = await Notification.requestPermission();
        this.#permission = permission;

        return permission === "granted";
    }

    notify(title, options = {}){
        if(!("Notification" in window)) return false;

        if(Notification.permission !== "granted") return false;

        new Notification(title, options);
        return true;
    }
}