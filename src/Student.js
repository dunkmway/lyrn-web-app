import { requestSignOut, getCurrentUser } from "./_authorization";

window.signOut = requestSignOut;
window.location.replace(`${location.origin}/test-taker/${await getCurrentUser()}`);