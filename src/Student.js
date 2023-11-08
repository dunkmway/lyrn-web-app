import { requestSignOut, getCurrentUser } from "./_authorization";

window.signOut = requestSignOut;
document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
    renderSalutation();
    const free = document.querySelector('.free');
    const self = document.querySelector('.self');
    const tutor = document.querySelector('.tutor');

    const user = await getCurrentUser();

    free.href = `${location.origin}/test-taker/${user.uid}?mode=marketing`;
    self.href = `${location.origin}/self-guided`
    tutor.href = `${location.origin}/test-taker/${user.uid}`;
}

async function renderSalutation() {
    const currentUser = await getCurrentUser();
    const name = currentUser.displayName.split(' ')[0];
  
    document.getElementById('salutation').textContent = `Hey ${name}!`
  }