function createAnalyticsEvent(data) {
    if (window.location.hostname == 'localhost' || window.location.hostname == '127.0.0.1') return;

    let analyticsID = localStorage.getItem('analyticsID_v1');
    if (!analyticsID) {
      analyticsID = firebase.firestore().collection('Analytics').doc().id
      localStorage.setItem('analyticsID_v1', analyticsID);
      firebase.firestore().collection('Analytics').doc('_Aggregate').update({
        analyticsIDs: firebase.firestore.FieldValue.arrayUnion(analyticsID)
      })
    }

    return firebase.firestore().collection('Analytics').doc().set({
      ...data,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      analyticsID,
      page: window.location.pathname
    })
}

function checkForLead() {
    const params = new URLSearchParams(document.location.search);
    const source = params.get("source");

    if (source) {
        createAnalyticsEvent({
            eventID: 'source',
            data: { source }
        })
    }
}

checkForLead()