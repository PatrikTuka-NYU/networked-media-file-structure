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

generateReply().then((results) => {
  console.log(results);
});
