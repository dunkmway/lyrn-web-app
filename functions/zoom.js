const functions = require("firebase-functions");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const axios = require("axios").default;

const zoomBaseURL = 'https://api.zoom.us/v2'

exports.zoomTest = functions.https.onCall(async (data, context) => {
  const payload = {
    iss: functions.config().zoom.key,
    exp: Math.round(((new Date()).getTime() + 5000) / 1000)
  };
  
  const token = jwt.sign(payload, functions.config().zoom.secret);
  
  var config = {
    method: 'post',
    url: '/users/zdUkw8oGTt6_g3yDUD4icQ/meetings',
    baseURL: zoomBaseURL,
    data: {
      topic: 'TEST meeting from api',
      type: 2,
      start_time: '2021-12-09T12:00:00Z',
      duration: 60,
    },
    headers: {
      Authorization: 'Bearer ' + token
    }
  }

  let response = await axios(config);

  //we don't need to send back the whole entire response (probably key parts of the data) but firebase won't let us send back the response. We first have to break ti down to it's parts.
  //IDK why but that is what got it to work.
  return convertAxiosResponseToJSON(response);
});

exports.zoomTestCreateUser = functions.https.onRequest(async (req, res) => {
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
          email: 'matthew15243@gmail.com',
          type: 1,
          first_name: 'Matthew',
          last_name: 'Wilkinson',
        }
    },
    headers: {
      Authorization: 'Bearer ' + token
    }
  }

  let response = await axios(config);

  console.log(response)
  res.send('All good');
});

function convertAxiosResponseToJSON(axiosResponse) {
  return {
    data: axiosResponse.data,
    status: axiosResponse.status,
    statusText: axiosResponse.statusText,
    headers: axiosResponse.headers,
    config: axiosResponse.config,
  }
}

exports.createZoomUser = functions.firestore
.document('/Users/{userID}')
.onCreate(async (snap, context) => {
  if (snap.data().role == 'tutor') {
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

exports.createZoomMeeting = functions.firestore
.document('/Events/{eventID}')
.onCreate(async (snap, context) => {
  if (snap.data().type == 'subjectTutoring') {
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