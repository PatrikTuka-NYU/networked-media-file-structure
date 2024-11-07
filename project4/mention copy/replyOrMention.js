/*/////////////////////////////////////////////////////
 *
 *
 *
 * imports and setups so we can log into mastodon using the correct token
 * this is the same we did in the previous class
 *
 *
 */ /////////////////////////////////////////////////////
require("dotenv").config();
const m = require("masto");
const masto = m.createRestAPIClient({
  url: "https://networked-media.itp.io/", // url we are making the request to, this should be our url
  accessToken: process.env.TOKEN, // this uses the .env file variable TOKEN.
  // process.env is defined by the require("dotenv")
});

/*/////////////////////////////////////////////////////
 *
 *
 *
 * replying to a specific post with a message
 *
 *
 *
 */ /////////////////////////////////////////////////////

// we need to use a different client in order to run all the time
// this will pull in every notification as they happen
const stream = m.createStreamingAPIClient({
  accessToken: process.env.TOKEN,
  streamingApiUrl: "wss://networked-media.itp.io", // special url we use for sockets
});

// async function to wait for the notification and reply to it
async function reply() {
  // finding the specific route to watch for notifications
  // based off the stream client and the notification path
  const notificationSubscription = await stream.user.notification.subscribe();

  // makes sure objects exist in the returned obj before going through array
  for await (let notif of notificationSubscription) {

    // printing the structure to the console to see how to access data
    console.log("-------HERE--------");
    console.log(notif.payload.type);
    console.log("-------HERE--------");

    // local variables for each piece of data i want
    let type = notif.payload.type;
    let acct = notif.payload.account.acct;
    let replyId = notif.payload.status.id;

    // if the type of notification is a mention
    if (notif.payload.type == "mention") {

      console.log("I WAS MENTIONED");

        // create a status
      const status = await masto.v1.statuses.create({
        status: `@${acct}, ${await generateReply()}`,    // reply to user that originally mentioned
        visibility: "public",
        in_reply_to_id: replyId,        // id # of the mention post so that you reply in the thread
      });
    }
  }
}

const nedb = require("@seald-io/nedb")

let database = new nedb({
    filename: "database.txt",
    autoload: true
  });

async function generateReply() {
    let query = {};
    let sortQuery = {
      timestamp: 1
    }

    return new Promise((resolve, reject) => {
      database.find(query).exec((err, retreivedData) => {
        let rand = Math.floor(Math.random()* retreivedData.length)
        let selected_response = retreivedData[rand]

        if(err) {
          reject(err)
        }
        else {
          resolve(selected_response.text);
        }
      })
    });
}


// call the reply function so it can always wait for notifications
reply()