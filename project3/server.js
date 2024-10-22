const express = require('express');
const app = express();

// For reading in the files
const fs = require('fs');

const uuid = require('uuid');

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get("/", (req, res) => {
    res.render("index.ejs", {})
})

// GLOBAL VARIABLES ----------------------------------------------------
let PRINTING_TIME = 8;
let DATABASE = [];

DATABASE["test"] = {
    press_name: "Sample Press",
    entrance_code: "password",
    press_id: "test",
    rules: {
        recurrence: "monthly",
        first_issue: new Date(Date.UTC(2024, 8, 19, PRINTING_TIME, 0)),
        question_types: ["check_in", "random"]
    },
    current_issue: {
        issue_number: 1,
        issue_date: new Date(Date.UTC(2024, 9, 19, PRINTING_TIME, 0)),
            contributors: ["John Doe", "Jane Doe", "Me", "Myself", "I"],
            questions: [
                {
                    question_type: "check_in",
                    question_prompt: "What made you happy today?",
                },
                {
                    question_type: "random",
                    question_prompt: "Who here is most likely to own 20 house plants and give each of them unique names?",
                }
            ],
            answers: [
                {
                    contributor: "John Doe",
                    date: new Date(Date.UTC(2024, 8, 19, PRINTING_TIME, 0)),
                    responses: [
                        "I finally finished a book that I’ve been reading for weeks, and the ending was perfect.",
                        "Definitely Jane Doe!"
                    ]
                },
                {
                    contributor: "Jane Doe",
                    date: new Date(Date.UTC(2024, 9, 12, PRINTING_TIME, 0)),
                    responses: [
                        "I took a long walk in the park, and the autumn colors were beautiful.",
                        "Probably all of us."
                    ]
                },
                {
                    contributor: "Myself",
                    date: new Date(Date.UTC(2024, 8, 21, PRINTING_TIME, 0)),
                    responses: [
                        "I received a compliment at work that made me feel appreciated.",
                        "Definitely me. I mean not like me, but me. Do you get me?!"
                    ]
                }
            ] 
    },
    past_issues: [
        {
            issue_number: 0,
            issue_date: new Date(Date.UTC(2024, 8, 20, PRINTING_TIME, 0)),
            contributors: ["I"],
            questions: [
                {
                    question_type: "sample",
                    question_prompt: "This is a previous question. What do you think about it?",
                },
            ],
            answers: [
                {
                    contributor: "PAST",
                    date: new Date(Date.UTC(2024, 8, 9, PRINTING_TIME, 0)),
                    responses: [
                        "This is a previous answer. This is what I thought about it"
                    ]
                },
            ] 

        }
    ]
};

// SETTING UP THE BASIC ROUTES -----------------------------------------
app.get('/create', (req, res) => {
    res.render("create_press.ejs", {});
})

app.get('/join', (req, res) => {
    res.render("join_press.ejs", {})
})

app.get('/press/:press_id', (req, res) => {
    const pressId = req.params.press_id;
    const pressData = DATABASE[pressId];

    const recurrence = pressData.rules.recurrence;
    const issues = pressData.past_issues;

    issueHandler(pressData);

    if (pressData) {
        res.render("press_template.ejs", {
            press_name: pressData.press_name,
            press_id: pressData.press_id,
            new_release_date: formatDate(pressData.current_issue.issue_date),
            past_issues: pressData.past_issues
        });
    }
    else {
        res.status(404).send("Press not found!");
    }
})

app.get('/press/:press_id/issue/:issue_id', (req, res) => {

    if (typeof DATABASE[req.params.press_id] != "undefined") {
        const currentIssue = DATABASE[req.params.press_id].past_issues[req.params.issue_id];

        const dataPacket = {
            issue_number: DATABASE[req.params.press_id].past_issues[req.params.issue_id].issue_number,
            press_name: DATABASE[req.params.press_id].press_name,
            press_id: req.params.press_id,
            release_date: formatDate(DATABASE[req.params.press_id].past_issues[req.params.issue_id].issue_date),
            contributors:  DATABASE[req.params.press_id].past_issues[req.params.issue_id].contributors,
            questions:  DATABASE[req.params.press_id].past_issues[req.params.issue_id].questions,
            answers: DATABASE[req.params.press_id].past_issues[req.params.issue_id].answers
        }

        res.render("issue_read.ejs", {dataPacket});
    }
    else {
        res.status(404).send("Press not found!");
    }
})

app.get('/press/:press_id/submit-response', (req, res) =>  {
    const pressId = req.params.press_id;
    const pressData = DATABASE[pressId];

    const dataPacket = {
        press_name: pressData.press_name,
        press_id: pressData.press_id,
        issue_number: pressData.current_issue.issue_number,
        issue_date: formatDate(pressData.current_issue.issue_date),
        questions: pressData.current_issue.questions
    }

    if (pressData) {
        res.render("issue_submit.ejs", dataPacket)
    }
    else {
        res.status(404).send("Press not found!");
    }
})


// HANDLING QUERIES ----------------------------------------------------
app.get('/create_request', (req, res) => {
    const generated_id = uuid.v4();

    let first_release = req.query.first_release.split('-').map(i=>Number(i));
    first_release = new Date(Date.UTC(first_release[0], first_release[1], first_release[2], PRINTING_TIME, 0));

    DATABASE[generated_id] = {
        press_name: req.query.press_name,
        entrance_code: req.query.entrance_code,
        press_id: generated_id,
        rules: {
            recurrence: req.query.recurrence,
            first_release: first_release,
            question_types: req.query.question_types
        },
        current_issue: {
            issue_number: 0,
            issue_date: first_release,
            contributors: [],
            questions: [
                {
                    question_type: "intro",
                    question_prompt: "How excited are you to get started?",
                }
            ],
            answers: []
        },
        past_issues: []
    };

    console.log("[CREATE]: new default press created with id: " + generated_id);
    res.redirect("/press/" + generated_id);
})

app.get('/join_request', (req, res) => {
    const current_id = req.query.press_id

    if (DATABASE[current_id] != undefined && DATABASE[current_id].entrance_code == req.query.entrance_code) {
        res.redirect("/press/" + current_id);
    }
    else {
        res.status(404).send("Press not found!");
    }
})

app.get('/press/:press_id/process_answers', (req, res) =>{
    const pressId = req.params.press_id;

    let current_responses = []

    if (typeof req.query.check_in != "undefined") {
        current_responses.push(req.query.check_in);
    }
    if (typeof req.query.relationships != "undefined") {
        current_responses.push(req.query.relationships);
    }
    if (typeof req.query.self_reflection != "undefined") {
        current_responses.push(req.query.self_reflection);
    }
    if (typeof req.query.random != "undefined") {
        current_responses.push(req.query.random);
    }
    if (typeof req.query.intro != "undefined") {
        current_responses.push(req.query.intro);
    }

    console.log(current_responses);

    const existingAnswerIndex = DATABASE[pressId].current_issue.answers.findIndex(answer => answer.contributor === req.query.contributor);
    if (existingAnswerIndex !== -1) {
        DATABASE[pressId].current_issue.answers.splice(existingAnswerIndex, 1);
    }
    else {
        DATABASE[pressId].current_issue.contributors.push(req.query.contributor)
    }

    DATABASE[pressId].current_issue.answers.push({
        contributor: req.query.contributor,
        date: new Date(),
        responses: [...current_responses]
    });

    res.render("complete_submission.ejs", {
        issue_number: DATABASE[pressId].current_issue.issue_number,
        press_name: DATABASE[pressId].press_name,
        release_date: formatDate(DATABASE[pressId].current_issue.issue_date),
        press_id: pressId
    });
    
    console.log("[RECORD] - User data recorded by contributor: ${req.query.contributor} of ${DATABASE[pressId].press_name}")

})

// {THIS IS FOR THE DEMO ONLY}
app.get("/press/:press_id/demo", (req, res) => {
    const pressId = req.params.press_id;

    res.send(DATABASE[pressId].current_issue);
})

// HELPER FUNCTIONS ----------------------------------------------------
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function formatDate(date) {
    return date.toLocaleString().split(',')[0];
}


function upcomingRelease(recurrence, current_issue_date) {
    let upcomingRelease = new Date(current_issue_date);

    switch(recurrence) {
        case "weekly":
            upcomingRelease.setUTCDate(upcomingRelease.getUTCDate() + 7);
            break;
        case "monthly":
            upcomingRelease.setUTCMonth(upcomingRelease.getUTCMonth() + 1);
            break;
        case "yearly":
            upcomingRelease.setUTCFullYear(upcomingRelease.getUTCFullYear() + 1);
            break;
    }

    return upcomingRelease;
}

function createNewIssue(press) {

    let question_list = []
    let question_bank = JSON.parse(fs.readFileSync("private/question_bank.json", "utf-8"));

    if (press.rules.question_types.includes("check_in")) {
        question_list.push({
            question_type: "check_in",
            question_prompt: question_bank[0].questions[getRandomInt(question_bank[0].questions.length)]
        });
    }

    if (press.rules.question_types.includes("relationships")) {
        question_list.push({
            question_type: "relationships",
            question_prompt: question_bank[1].questions[getRandomInt(question_bank[1].questions.length)]
        });
    }

    if (press.rules.question_types.includes("self_reflection")) {
        question_list.push({
            question_type: "self_reflection",
            question_prompt: question_bank[2].questions[getRandomInt(question_bank[2].questions.length)]
        });
    }

    if (press.rules.question_types.includes("random")) {
        question_list.push({
            question_type: "random",
            question_prompt: question_bank[3].questions[getRandomInt(question_bank[3].questions.length)]
        });
    }

    return {
        issue_number: press.current_issue.issue_number +1,
        issue_date: upcomingRelease(press.rules.recurrence, press.current_issue.issue_date),
        contributors: [],
        questions: question_list,
        answers: []
    };
}

function issueHandler(press) {
    let current_date = new Date();

    if (press.current_issue.issue_date <= current_date) {
        
        // Move current_issue into past issues
        press.past_issues.push({
            issue_number: press.current_issue.issue_number,
            issue_date: new Date(press.current_issue.issue_date),
            contributors: [...press.current_issue.contributors],
            questions: press.current_issue.questions.map(q => ({ ...q })),
            answers: press.current_issue.answers.map(a => ({
            contributor: a.contributor,
            date: new Date(a.date),
            responses: [...a.responses]
            }))
        });

        // Create new issue with createNewIssue(press) function
        press.current_issue = createNewIssue(press);
    }

    console.log("[HANDLER]: press issue updated for: " + press.press_id)
}

// MAIN SERVER LISTENER ------------------------------------------------
const port_number = 8080;
app.listen(port_number, ()=> {
    console.log("[START]: The server is listening on port: " + port_number);
    console.log("[REFERENCE]: The current time is: " + new Date().toLocaleTimeString())

    //make sure all issues are updated
    for (const [key, value] of Object.entries(DATABASE)) {
        issueHandler(DATABASE[key])
    }
})