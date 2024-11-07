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

    let currentDate = new Date()
    console.log(currentDate);

    const params = {
        month: currentDate.getMonth() + 1,
        day: currentDate.getDate(),
        type: "date"
    }

    return await fetch(`http://numbersapi.com/${params.month}/${params.day}/${params.type}?json`)
    .then(response => response.json())
    .then(data => {return data.text})
}

async function controller() {
    var fact = await queryAPI();
    makeStatus("[!FUN FACT!]: " + fact);
}

controller();
setInterval(controller, 1000 * 60 * 60 * 24);