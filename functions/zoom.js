const functions = require("firebase-functions");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const axios = require("axios").default;

const express = require('express');

const app = express();

// Automatically allow cross-origin requests
// app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const zoomBaseURL = 'https://api.zoom.us/v2'

function convertAxiosResponseToJSON(axiosResponse) {
  return {
    data: axiosResponse.data,
    status: axiosResponse.status,
    statusText: axiosResponse.statusText,
    headers: axiosResponse.headers,
    config: axiosResponse.config,
  }
}

/**
 * create zoom user when a user is first created in auth
 */
exports.createZoomUser = functions.firestore
.document('/Users/{userID}')
.onCreate(async (snap, context) => {
  if (['tutor', 'admin', 'dev'].includes(snap.data().role)) {
    const payload = {
      iss: functions.config().zoom.key,
      exp: Math.round(((new Date()).getTime() + 5000) / 1000)
    };
    
    const token = jwt.sign(payload, functions.config().zoom.secret);
    
    var config = {
      method: 'post',
      url: '/users',
      baseURL: zoomBaseURL,
      data: {
        action: 'create',
        user_info: {
          email: snap.data().email,
          type: 1,
          first_name: snap.data().firstName,
          last_name: snap.data().lastName,
        }
      },
      headers: {
        Authorization: 'Bearer ' + token
      }
    }
  
    let response = await axios(config);
    console.log(convertAxiosResponseToJSON(response))
    await snap.ref.update({
      zoomID: response.data.id
    })
  }
  return;
});

// zoom meeting creation is handled when sedning out the lesson-link email

/**
 * triggered when an event is updated in the Event collection
 */

 exports.updateZoomMeeting = functions.firestore
  .document('/Events/{eventID}')
  .onUpdate(async (change, context) => {
    const newValues = change.after.data();
    const oldValues = change.before.data();

    // if the old values didn't have a zoom meeting id then there is nothing to update
    if (!oldValues.zoomMeetingID) return;

    // if the values that should be updated have actually changed then continue. if not return 
    // with zoom we can't change the tutor without paying so we will just restrict the admin from changing the tutor
    // this means the only thing that zoom cares about changing is the time
    if (newValues.start == oldValues.start && newValues.end == oldValues.end) return;

    const payload = {
      iss: functions.config().zoom.key,
      exp: Math.round(((new Date()).getTime() + 5000) / 1000)
    };

    //update the zoom meeting
    const token = jwt.sign(payload, functions.config().zoom.secret);

    var config = {
      method: 'patch',
      url: `/meetings/${oldValues.zoomMeetingID}`,
      baseURL: zoomBaseURL,
      data: {
        start_time: convertMilliToZoomDateFormat(newValues.start),
        duration: (newValues.end - newValues.start) / 60000,
      },
      headers: {
        Authorization: 'Bearer ' + token
      }
    }

    try {
      await axios(config);
     }
     catch (error) {
      console.log(error)
     }
     return;
  });

 /**
 * triggered when an event is updated in the Event collection
 */
  exports.deleteZoomMeeting = functions.firestore
  .document('/Events/{eventID}')
  .onDelete(async (snap, context) => {
    const deletedValues = snap.data();

    // if the delete doc didn't have a zoom meeting id then there is nothing to delete
    if (!deletedValues.zoomMeetingID) return;

    const payload = {
      iss: functions.config().zoom.key,
      exp: Math.round(((new Date()).getTime() + 5000) / 1000)
    };
 
    //delete the zoom meeting
    const token = jwt.sign(payload, functions.config().zoom.secret);
 
   var config = {
     method: 'delete',
     url: `/meetings/${deletedValues.zoomMeetingID}`,
     baseURL: zoomBaseURL,
     headers: {
       Authorization: 'Bearer ' + token
     }
   }
 
   try {
    await axios(config);
   }
   catch (error) {
    console.log(error)
   }
   return;
  });

function convertMilliToZoomDateFormat(timeMilli) {
  const time = new Date(timeMilli);
  const year = time.getFullYear().toString().padStart(4, '0');
  const month = (time.getMonth()+1).toString().padStart(2, '0');
  const day = time.getDate().toString().padStart(2, '0');
  const hour = time.getHours().toString().padStart(2, '0');
  const minute = time.getMinutes().toString().padStart(2, '0');
  const second = time.getSeconds().toString().padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`
}

exports.updateZoomLicenseDaily = functions.pubsub.schedule('0 1 * * *').timeZone('America/Denver').onRun(async (context) => {
  // get all of our tutors
  const tutorQuery = await admin.firestore().collection('Users').where('zoomID', '!=', '').get();

  // go through each tutor and give them a license if they have a lesson today an set them to basic if not
  await Promise.allSettled(tutorQuery.docs.map(async (tutorDoc) => {
    // check if this tutor has a lesson today
    const eventQuery = await admin.firestore().collection('Events')
    .where('start', '>=', new Date().setHours(6,0,0,0))
    .where('start', '<', new Date().setHours(30,0,0,0))
    .where('staff', 'array-contains', tutorDoc.id)
    .get();

    const payload = {
      iss: functions.config().zoom.key,
      exp: Math.round(((new Date()).getTime() + 5000) / 1000)
    };
    const token = jwt.sign(payload, functions.config().zoom.secret);

    if (eventQuery.size > 0) {
      // tutor has lessons
      await axios({
        method: 'patch',
        url: `/users/${tutorDoc.data().zoomID}`,
        baseURL: zoomBaseURL,
        headers: {
          Authorization: 'Bearer ' + token,
          ['Content-Type']: 'application/json'
        },
        data: {
          type: 2
        },
      });
    }
    else {
      // tutor does not have lessons
      await axios({
        method: 'patch',
        url: `/users/${tutorDoc.data().zoomID}`,
        baseURL: zoomBaseURL,
        headers: {
          Authorization: 'Bearer ' + token,
          ['Content-Type']: 'application/json'
        },
        data: {
          type: 1
        },
      });
    }
  }))
  return
});

// exports.updateZoomLicenseDaily_test = functions.https.onRequest(async (request, response) => {
//   // get all of our tutors
//   const tutorQuery = await admin.firestore().collection('Users').where('zoomID', '!=', '').get();

//   // go through each tutor and give them a license if they have a lesson today an set them to basic if not
//   const patchRequests = await Promise.allSettled(tutorQuery.docs.map(async (tutorDoc) => {
//     // check if this tutor has a lesson today
//     const eventQuery = await admin.firestore().collection('Events')
//     .where('start', '>=', new Date().setHours(6,0,0,0))
//     .where('start', '<', new Date().setHours(30,0,0,0))
//     .where('staff', 'array-contains', tutorDoc.id)
//     .get();

//     console.log(tutorDoc.data().firstName + ' ' + tutorDoc.data().lastName)

//     // if (eventQuery.size > 0) {
//     //   console.log('tutor and their lessons')
//     //   console.log(tutorDoc.data(), eventQuery.docs.map(doc => doc.data()));
//     // }

//     const payload = {
//       iss: functions.config().zoom.key,
//       exp: Math.round(((new Date()).getTime() + 5000) / 1000)
//     };
//     const token = jwt.sign(payload, functions.config().zoom.secret);

//     if (eventQuery.size > 0) {
//       // tutor has lessons
//       await axios({
//         method: 'patch',
//         url: `/users/${tutorDoc.data().zoomID}`,
//         baseURL: zoomBaseURL,
//         headers: {
//           Authorization: 'Bearer ' + token,
//           ['Content-Type']: 'application/json'
//         },
//         data: {
//           type: 2
//         },
//       });
//     }
//     else {
//       // tutor does not have lessons
//       await axios({
//         method: 'patch',
//         url: `/users/${tutorDoc.data().zoomID}`,
//         baseURL: zoomBaseURL,
//         headers: {
//           Authorization: 'Bearer ' + token,
//           ['Content-Type']: 'application/json'
//         },
//         data: {
//           type: 1
//         },
//       });
//     }
//     return
//   }))
//   response.send(patchRequests)
// });



app.get('/', (req, res) => res.status(200).send('Zoom webhook is online!'))

app.post('/meeting/join-leave', async (req, res) => {
  console.log('POST /meeting/join-leave called')
  try {
    // append the event to the lesson that is connected to this meeting
    const body = req.body;
    const zoomMeetingID = Number(body.payload.object.id);

    const lessonQuery = await admin.firestore().collection('Events').where('zoomMeetingID', '==', zoomMeetingID).limit(1).get();
    if (lessonQuery.size != 1) {
      // the zoom meeting is not connected to a lesson in our database so we can ignore this request
      console.log('no lesson is associated with this zoom meeting with an id of', zoomMeetingID);
      return res.status(200).end();
    }
    else {
      console.log('the lesson connected to this zoom meeeting has an id of', lessonQuery.docs[0].id)
      await lessonQuery.docs[0].ref.update({
        timeline: admin.firestore.FieldValue.arrayUnion(body)
      });

      return res.status(200).end()
    }
  } catch (error) {
    console.log(error)
    return res.status(500).end();
  }
})



exports.webhook = functions.https.onRequest(app);