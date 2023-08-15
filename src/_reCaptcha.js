import app from "./_firebase";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LejnxEdAAAAAE01TS3gbg8dFJHw6dPgWv3YJBnK'),
    isTokenAutoRefreshEnabled: true
})

export default appCheck;