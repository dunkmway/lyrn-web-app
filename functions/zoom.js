const functions = require("firebase-functions");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const axios = require("axios").default;

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
    console.log(response)
    await snap.ref.update({
      zoomID: response.data.id
    })
  }
  return;
});

/**
 * triggered when a subject tutoring lesson is create
 */
exports.createZoomMeeting = functions.firestore
.document('/Events/{eventID}')
.onCreate(async (snap, context) => {
  const payload = {
    iss: functions.config().zoom.key,
    exp: Math.round(((new Date()).getTime() + 5000) / 1000)
  };

  const eventData = snap.data();
  
  const token = jwt.sign(payload, functions.config().zoom.secret);

  //get the zoomID of the tutor who is assigned to this meeting
  let tutorDoc = await admin.firestore().collection('Users').doc(eventData.staff[0]).get()

  var config = {
    method: 'post',
    url: `/users/${tutorDoc.data().zoomID}/meetings`,
    baseURL: zoomBaseURL,
    data: {
      topic: eventData.title,
      type: 2,
      start_time: convertMilliToZoomDateFormat(eventData.start),
      duration: (eventData.end - eventData.start) / 60000,
    },
    headers: {
      Authorization: 'Bearer ' + token
    }
  }

  let response = await axios(config);
  console.log(response)
  await snap.ref.update({
    staffZoomURL: response.data.start_url,
    studentZoomURL: response.data.join_url,
    zoomMeetingID: response.data.id
  })
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