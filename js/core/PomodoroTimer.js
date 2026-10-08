export class PomodoroTimer {

    #workDuration;

    #breakDuration;

    #remainingSeconds;

    #isWorkSession;

    #intervalId;

    #onTick;

    #onSessionChange;



    constructor({
        workDuration = 25 * 60,
        breakDuration = 5 * 60,
        onTick = () => {},
        onSessionChange = () => {}
    } = {}) {

        this.#workDuration =
            workDuration;

        this.#breakDuration =
            breakDuration;

        this.#remainingSeconds =
            workDuration;

        this.#isWorkSession =
            true;

        this.#intervalId =
            null;

        this.#onTick =
            onTick;

        this.#onSessionChange =
            onSessionChange;

    }



    // Starts the Pomodoro timer.

    start() {

        if(
            this.#intervalId !== null
        ){

            return false;

        }



        this.#intervalId =
            setInterval(
                () => this.#tick(),
                1000
            );



        this.#onTick(
            this.#remainingSeconds
        );



        return true;

    }



    // Pauses the Pomodoro timer.

    pause() {

        if(
            this.#intervalId === null
        ){

            return false;

        }



        clearInterval(
            this.#intervalId
        );



        this.#intervalId =
            null;



        return true;

    }



    // Resets the current Pomodoro session.

    reset() {

        this.pause();



        this.#isWorkSession =
            true;



        this.#remainingSeconds =
            this.#workDuration;



        this.#onSessionChange(
            "WORK"
        );



        this.#onTick(
            this.#remainingSeconds
        );

    }



    // Returns whether the timer is running.

    isRunning() {

        return (
            this.#intervalId !== null
        );

    }



    // Returns the current session type.

    getSessionType() {

        return this.#isWorkSession
            ? "WORK"
            : "BREAK";

    }



    // Returns remaining time as MM:SS.

    getDisplayTime() {

        const minutes =
            Math.floor(
                this.#remainingSeconds /
                60
            );



        const seconds =
            this.#remainingSeconds %
            60;



        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    }



    #tick() {

        this.#remainingSeconds--;



        if(
            this.#remainingSeconds <= 0
        ){

            this.#switchSession();

        }



        this.#onTick(
            this.#remainingSeconds
        );

    }



    #switchSession() {

        this.#isWorkSession =
            !this.#isWorkSession;



        if(
            this.#isWorkSession
        ){

            this.#remainingSeconds =
                this.#workDuration;

            this.#onSessionChange(
                "WORK"
            );

        }
        else{

            this.#remainingSeconds =
                this.#breakDuration;

            this.#onSessionChange(
                "BREAK"
            );

        }

    }

}

