const express = require("express");
const nedb = require("@seald-io/nedb")

const app = express();

let database = new nedb({
  filename: "database.txt",
  autoload: true
});

app.use(express.static("public"));
app.set("view engine", "ejs");


app.get("/", (request, response) => {
  let query = {};
  let sortQuery = {
    timestamp: 1
  }

  database.find(query).sort(sortQuery).exec((err, retreivedData) => {
    response.render("index.ejs", {responses: retreivedData})
  })
});

app.get('/upload', (req, res) => {
  let currentDate = new Date();

  console.log(req.query.response_input);

  let data = {
    text: req.query.response_input,
    date: currentDate.toLocaleString(),
    timestamp: currentDate.getTime()
  }

  database.insert(data, (err, newData) => {
    console.log(newData);
    res.redirect("/");
  })
})

app.listen(6001, () => {
  console.log("server started on port 6001");
});
