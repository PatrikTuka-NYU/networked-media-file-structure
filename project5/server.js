const express = require("express");
const bodyParser = require("body-parser");
const nedb = require("@seald-io/nedb");
const bcrypt = require("bcrypt");
const multer = require("multer");
const fs = require("fs");
const expressSession = require("express-session");
const nedbSessionStore = require("nedb-promises-session-store");

const app = express();
const port = 3000;

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));

const parents_db = new nedb({
  filename: "databases/parents.txt",
  autoload: true
});

const upload = multer({
  dest: "public/uploads"
});

const nedbSessionInit = nedbSessionStore({
  connect: expressSession,
  filename: "sessions.txt"
});

app.use(
  expressSession({
    store: nedbSessionInit,
    cookie: {
      maxAge: 365 * 24 * 60 * 60 * 1000
    },
    secret: "supersecret123",
    resave: false,
    saveUninitialized: false
  })
);

function requiresAuth(req, res, next) {
  if (req.session.loggedInUser) {
    next();
  } else {
    res.redirect("/parent/login");
  }
}


// PARENTAL FLOW ------------------------------------------------------
app.get("/parent/login", (req, res) => {
  res.render("parent_login.ejs");
});

app.get("/parent/signup", (req, res) => {
  res.render("parent_signup.ejs");
});

app.post("/parent/login", (req, res) => {
  let search_query = {
    username: req.body.username,
    child_name: req.body.child_name
  };

  parents_db.findOne(search_query, (err, user) => {
    if (err || user == null) {
      res.send("User Not Found! Please Try Again.");
    } else {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        console.log(`[LOGIN]: User "${user._id}" successfully logged in`);

        let session = req.session;
        session.loggedInUser = user.username;

        res.redirect(`/parent/${user._id}/`);
      } else {
        res.send("Incorrect Password! Please Try Again.");
      }
    }
  });
});

app.get("/logout", requiresAuth, (req, res) => {
  delete req.session.loggedInUser;
  res.redirect("/parent/login");
});

app.post("/parent/signup", (req, res) => {
  let user_data = {
    username: req.body.username,
    child_name: req.body.child_name,
    password: bcrypt.hashSync(req.body.password, 10),
    creation_time: new Date().toUTCString(),
    entries: [],
    secret_code: generateCode()
  };

  parents_db.insert(user_data, (err, inserted_data) => {
    console.log("[SIGNUP]: New user registered with id: " + inserted_data._id);
    res.redirect(`/parent/${inserted_data._id}/`);
  });
});

function generateCode() {
  const characters = "abcdefghijklmnopqrstuvwxyz";
  const length = 18;
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  console.log(result);
  return result;
}

app.get("/parent/:parent_id", requiresAuth, (req, res) => {
  parents_db.findOne({ _id: req.params.parent_id }, (err, user) => {
    let data = {
      id: user["_id"],
      child_name: user.child_name,
      entries: user.entries,
      secret_key: user.secret_code
    };

    res.render("parent_dashboard.ejs", data);
  });
});

app.get("/parent/:parent_id/create-entry", requiresAuth, (req, res) => {
  parents_db.findOne({ _id: req.params.parent_id }, (err, user) => {
    let data = {
      id: user._id
    };
    res.render("create_entry.ejs", data);
  });
});

app.post(
  "/parent/:parent_id/add-entry",
  requiresAuth,
  upload.array("file"),
  (req, res) => {
    parents_db.findOne({ _id: req.params.parent_id }, (err, user) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).send("Internal Server Error");
      }
      if (!user) {
        return res.status(404).send("User not found!");
      }

      let entry_data = {
        entry_date: new Date().toLocaleDateString(),
        entry_title: req.body.entry_title,
        entry_body: req.body.entry_body,
        images: req.files
      };

      let search_query = { _id: req.params.parent_id };
      let update = { $push: { entries: entry_data } };

      parents_db.update(search_query, update, {}, (err, numUpdated) => {
        if (err) {
          res.send("Error updating entry. Please try again.");
        } else {
          if (err) {
            console.error("Error updating entry:", err);
            return res.status(500).send("Internal Server Error");
          }
          res.redirect(`/parent/${req.params.parent_id}/`);
        }
      });
    });
  }
);

app.get("/parent/:parent_id/inspiration", requiresAuth, (req, res) => {
  fs.readFile("databases/inspiration_quotes.json", (err, json_data) => {
    parents_db.findOne({ _id: req.params.parent_id }, (err, user) => {
      let data = {
        id: req.params.parent_id,
        child_name: user.child_name,
        all_quotes: JSON.parse(json_data)
      };
      res.render("inspiration.ejs", data);
    });
  });
});

app.get(
  "/parent/:parent_id/view_entries/letter-:letter_id",
  requiresAuth,
  (req, res) => {
    parents_db.findOne({ _id: req.params.parent_id }, (err, user) => {
      let data = {
        letter_date: user.entries[req.params.letter_id].entry_date,
        letter_title: user.entries[req.params.letter_id].entry_title,
        letter_body: user.entries[req.params.letter_id].entry_body,
        images: user.entries[req.params.letter_id].images,
        back_to_path: "/parent/" + req.params.parent_id
      };

      res.render("display_letter.ejs", data);
    });
  }
);

// CHILD FLOW ---------------------------------------------------
app.get("/child/:child_id", (req, res) => {
  res.render("child_intro.ejs", { id: req.params.child_id });
});

app.get("/child/unlock/:child_id", (req, res) => {
  res.render("child_unlock.ejs", { id: req.params.child_id });
});

app.post("/child/unlock/:child_id", (req, res) => {
  let search_query = {
    _id: req.params.child_id
  };

  parents_db.findOne(search_query, (err, user) => {
    if (err || user == null) {
      res.send("User Not Found! Please Try Again.");
    } else {
      console.log(req.body.secret_code);
      console.log(user.secret_code);
      if (req.body.secret_code.toLowerCase() == user.secret_code) {
        res.redirect(`/child/${req.params.child_id}/home`);
      } else {
        res.send("Incorrect Secret Key! Please Try Again.");
      }
    }
  });
});

app.get("/child/:child_id/home", (req, res) => {
  parents_db.findOne({ _id: req.params.child_id }, (err, user) => {
    let data = {
      id: user._id,
      child_name: user.child_name,
      entries: user.entries
    };

    console.log(data);
    res.render("child_home.ejs", data);
  });
});

app.get("/child/:child_id/view-letter/letter-:letter_id", (req, res) => {
  parents_db.findOne({ _id: req.params.child_id }, (err, user) => {
    let data = {
      letter_date: user.entries[req.params.letter_id].entry_date,
      letter_title: user.entries[req.params.letter_id].entry_title,
      letter_body: user.entries[req.params.letter_id].entry_body,
      images: user.entries[req.params.letter_id].images,
      back_to_path: `/child/${req.params.child_id}/home`
    };

    res.render("display_letter.ejs", data);
  });
});


// MAIN APP LISTEN ----------------------------------------------
app.listen(port, () => {
  console.log(`[START]: Server Started on port ${port}`);
});
