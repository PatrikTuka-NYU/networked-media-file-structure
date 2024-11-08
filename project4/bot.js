require("dotenv").config();

const m = require("masto");
const masto = m.createRestAPIClient({
    url: "https://networked-media.itp.io/",     
    accessToken: process.env.TOKEN
});

async function makeStatus(text) {
    const status = await masto.v1.statuses.create({
        status: text,
        visibility: "public"
    })

    console.log(status.url)
}

async function queryAPI() {
    return await fetch(`http://numbersapi.com/random/trivia?json`)
    .then(response => response.json())
    .then(data => {return data.text})
}

async function controller() {
    var fact = await queryAPI();
    makeStatus("[ ! YOUR (hopefully SFW) DAILY NUMBER FUN FACT ! ]: " + fact);
}

controller();
setInterval(controller, 1000 * 60 * 15);