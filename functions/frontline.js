const functions = require("firebase-functions");
const admin = require("firebase-admin");

const express = require('express');
const cors = require('cors');

const app = express();

// Automatically allow cross-origin requests
// app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => res.status(200).send('Frontline is online!'))

/**
 * request body
 * worker: email identifier of the worker to get customers for
 * pageSize: query limit
 * anchor: start after customer id
 * returns a list of customers for the given worker
 */
app.get('/customers', async (req, res) => {
  console.log('GET /customers called')
  try {
    const worker = req.query.worker;
    const pageSize = req.query.pageSize;
    const anchor = req.query.anchor;

    if (!worker) {
      console.log(req.query)
      console.log('400 status: worker is required in body')
      return res.status(400).send('worker is required in the body');
    }

    let customersRef = admin.firestore()
    .collection('Users')
    .where('role', '==' ,'parent')
    .where('worker', '==', worker)
    .orderBy('lastName')

    if (pageSize) {
      customersRef.limit(Number(pageSize))
    }
    if (anchor) {
      const anchorDoc = await admin.firestore().collection('Users').doc(anchor).get()
      customersRef.startAfter(anchorDoc)
    }
    
    const customerDocs = await customersRef.get();

    let customerList = customerDocs.docs.map((doc) => {
      const data = doc.data();
      return {
        customer_id: doc.id,
        display_name: data.firstName + " " + data.lastName,
        avatar: data.avatar
      }
    })

    console.log('done')
    console.log(customerList);

    return res.status(200).json({ customerList: customerList });
  } catch (error) {
    console.log(error)
    return res.status(500).send(error);
  }
})

/**
 * request parameters
 * id: customer id that we want to get
 * returns the customer object for twilio
 */
app.get('/customers/:id', async (req, res) => {
  console.log('GET /customers/:id called')
  try {
    const customerDoc = await admin.firestore()
    .collection('Users')
    .doc(req.params.id)
    .get();

    const customerData = customerDoc.data();
    const channels = [];
    let details = {};
    let links = [];

    if (customerData.role == 'parent') {
      // get their students
      const studentDocs = await admin.firestore()
      .collection('Users')
      .where('parents', 'array-contains', customerDoc.id)
      .get()

      let students = studentDocs.docs.map(doc => doc.data().firstName + " " + doc.data().lastName);
      details.title = 'Students';
      details.content = students.reduce((prev, curr) => {
        return prev + '\n' + curr;
      });

      //get their invoices
      const invoiceDocs = await admin.firestore()
      .collection('Invoices')
      .where('parent', '==', req.params.id)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

      invoiceDocs.forEach(async (doc) => {
        const link = {
          type: 'invoice',
          value: `https://lyrnwithus.com/payment-link?invoice=${doc.id}`,
          display_name: doc.data().status
        }
        links.push(link);
      })

    }
    else {
      details.title = 'This is a student'
    }

    if (customerData.email) {
      channels.push({
        type: 'email',
        value: customerData.email
      })
    }
    if (customerData.phoneNumber) {
      channels.push({
        type: 'sms',
        value: '+1' + customerData.phoneNumber.replace(/\(|\)|-| /g, '')
      })
    }

    return res.status(200).json({
      customer_id: customerDoc.id,
      display_name: customerData.firstName + " " + customerData.lastName,
      worker: customerData.worker,
      channels: channels,
      links,
      details
    })
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
    return;
  }
})

/**
 * request parameters
 * phoneNumber: customer phone number +1**********
 * returns the customer object for twilio
 */
 app.get('/customers/number/:phoneNumber', async (req, res) => {
  console.log('GET /customers/number/:phoneNumber called')
  try {
    let requestNumber = req.params.phoneNumber;
    //check the length
    if (requestNumber.length != 12) {
      return res.status(400).send('number is wrong format');
    }

    let formattedNumber = requestNumber.substring(2);
    let first = formattedNumber.substring(0,3);
    let second = formattedNumber.substring(3,6);
    let third = formattedNumber.substring(6,10);

    formattedNumber = `(${first}) ${second}-${third}`;

    const customerDocQuery = await admin.firestore()
    .collection('Users')
    .where('role', 'in', ['parent', 'student'])
    .where('phoneNumber', '==', formattedNumber)
    .limit(1)
    .get();

    //no users with this number
    if (customerDocQuery.size != 1) {
      return res.status(200).json({});
    }
    const customerDoc = customerDocQuery.docs[0];
    const customerData = customerDoc.data();

    console.log({
      customer_id: customerDoc.id,
      display_name: customerData.firstName + " " + customerData.lastName,
    })

    return res.status(200).json({
      customer_id: customerDoc.id,
      display_name: customerData.firstName + " " + customerData.lastName,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
    return;
  }
})

exports.frontline = functions.https.onRequest(app);