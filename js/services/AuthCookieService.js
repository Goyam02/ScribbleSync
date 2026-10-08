import { generateId } from "../utils/idgen.js";


export class AuthCookieService {

    #cookieName;

    #maxAge;



    constructor() {

        this.#cookieName =
            "scribblesync-session";

        this.#maxAge =
            60 * 60;

    }



    // Creates a fake login session.

    login() {

        const sessionId =
            generateId("session");



        const expiresAt =
            Date.now() +
            this.#maxAge * 1000;



        const cookieValue =
            `${sessionId}.${expiresAt}`;


        /*
         * SameSite=Strict prevents the
         * cookie from being sent in
         * cross-site requests.
         *
         * In production, use Secure
         * when the application is served
         * over HTTPS.
         */

        document.cookie =
            `${this.#cookieName}=${encodeURIComponent(cookieValue)}; ` +
            `max-age=${this.#maxAge}; ` +
            `SameSite=Strict; ` +
            `path=/`;



        return {
            sessionId,
            expiresAt
        };

    }



    // Checks whether the current session is valid.

    isSessionValid() {

        const cookie =
            this.getSessionCookie();



        if(!cookie){

            return false;

        }



        const decodedValue =
            decodeURIComponent(
                cookie
            );



        const separatorIndex =
            decodedValue.lastIndexOf(".");


        if(
            separatorIndex === -1
        ){

            return false;

        }



        const expiresAt =
            Number(
                decodedValue.slice(
                    separatorIndex + 1
                )
            );



        if(
            !Number.isFinite(
                expiresAt
            )
        ){

            return false;

        }



        return Date.now() <
            expiresAt;

    }



    // Returns the session cookie value.

    getSessionCookie() {

        const cookies =
            document.cookie.split("; ");


        const targetCookie =
            cookies.find(
                (cookie) =>
                    cookie.startsWith(
                        `${this.#cookieName}=`
                    )
            );


        if(!targetCookie){

            return null;

        }


        return targetCookie.substring(
            this.#cookieName.length + 1
        );

    }



    // Returns the expiry time of the current session.

    getExpiryTime() {

        const cookie =
            this.getSessionCookie();


        if(!cookie){

            return null;

        }


        const decodedValue =
            decodeURIComponent(
                cookie
            );


        const separatorIndex =
            decodedValue.lastIndexOf(".");


        if(
            separatorIndex === -1
        ){

            return null;

        }


        const expiresAt =
            Number(
                decodedValue.slice(
                    separatorIndex + 1
                )
            );


        return Number.isFinite(
            expiresAt
        )
            ? expiresAt
            : null;

    }



    // Logs the user out by deleting the cookie.

    logout() {

        document.cookie =
            `${this.#cookieName}=; ` +
            `max-age=0; ` +
            `SameSite=Strict; ` +
            `path=/`;

    }

}