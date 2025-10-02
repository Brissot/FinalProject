/* Check .env Environmental Variables */
const path = require("path");
require("dotenv").config({
    path: path.resolve(__dirname, '.env')
});

const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require("express"); /* Accessing express module */

const cfbRequests = require("./cfbRequests");

/* Check Arguments */
if (process.argv.length !== 3) {
    console.error("Usage app.js <port number>");
    process.exit(1);
}
/* retrieve argument. if deployed, make hostname retrieval more dynamic */
const portNumber = process.argv[2];
const hostname = "localhost";

/* Get the Environmental Variables out */
const username = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const dbName = process.env.MONGO_DB_NAME;
const collectionName = process.env.MONGO_COLLECTION;
const apiKey = process.env.CFB_API_KEY;

/* MongoDB Environmental Variables */
const databaseAndCollection = { db: dbName, collection: collectionName };
const uri = "mongodb+srv://" +
    username + ":" + password +
    "@sid-su.eczia3i.mongodb.net/" +
    "?retryWrites=true&w=majority&appName=Sid-Su";

let cfbRadio = new cfbRequests.cfbRequests(apiKey);

/*
express stuff
*/
const app = express(); /* app is a request handler function */

/* make the favicon available*/
app.use(
    '/favicon.ico',
    express.static(
        "media/american-football-transparent.png", {  maxAge: '30d' }
    )
);

/* make CSS available */
app.use(express.static('css', { maxAge: '30d' }));

/* make the images and video available */
app.use("/media", express.static("media", { maxAge: '30d' }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* directory where templates will reside */
app.set("views", path.resolve(__dirname, "templates"));
/* view/templating engine */
app.set("view engine", "ejs");

app.get("/healthz", (request, response) => {
    response.status(200).send("OK: College Football Stats is up");
});

app.get("/", (request, response) => {
    response.render("index");
});

app.get("/teamStats", (request, response) => {
    response.render("teamStats");
});

app.post("/teamStats", async (request, response) => {
    /* Get the required parameters out of the request body */
    let { team, year } = request.body;

    const table = await cfbRadio.getBets(year, team);

    let variables = {
        team: team,
        year: year,
        stats: table,
        summary: `${team} ${year} Season`
    };
    request = {
        name: `Stats for ${team} in ${year}`,
        data: variables.stats
    };
    //await addSearch(client, databaseAndCollection, request);
    response.render("teamStatsResults", variables);
});

app.get("/team", async (request, response) => {
    /* Get the required parameters out of the request body */
    let team= request.query["q"];
    let year= 2024;
    const rawData = await cfbRadio.getMatches(year, team);

    let teamConference;
    if (rawData[0].homeTeam === team)
        teamConference= rawData[0].homeConference;
    else
        teamConference= rawData[0].awayConference;

    console.log("hwat? " + teamConference);

    const conferenceInfo = await cfbRadio.getTeam(teamConference);

    console.log("Some Nice Conference Info: " + conferenceInfo);

    if (rawData.length === 0) {
        throw new Error("Team Does Not Exist");
    }

    let variables = {
        team: team,
        year: year,
        rawData: rawData
    };

    request = {
        name: `Stats for ${team} in ${year}`,
        data: variables.stats
    };

    //await addSearch(client, databaseAndCollection, request);
    response.render("team", variables);
});

app.get("/teamHistory", (request, response) => {
    response.render("teamHistory");
});

app.post("/teamHistory", async (request, response) => {
    let { team1, team2 } = request.body;

    matchupsInfo = await cfbRadio.getMatchups(team1, team2);
    const [table, summary, record] = matchupsInfo;


    let variables = {
        team1: team1,
        team2: team2,
        summary: summary + '<br>' + record,
        data: table
    };
    request = {
        name: `${team1} vs ${team2} History`,
        data: `${variables.summary}<br>${variables.data}`
    };
    //await addSearch(client, databaseAndCollection, request);
    response.render("teamHistoryResults", variables);
});

app.get("/searchHistory", async (request, response) => {
    variables = {
        searches: await getSearchHistory(client, databaseAndCollection)
    };
    response.render("searchHistory", variables);
});

app.post("/searchHistory", async (request, response) => {
    await clearSearchHistory(client, databaseAndCollection);
    variables = {
        searches: ""
    };
    response.render("searchHistory", variables);
});

app.get("/game", async (request, response, next) => {
    const { year, id } = request.query;

    if (year && id) {
        /* game. singular. object. */
	const [ game, gameTable ] = await cfbRadio.getGame(year, id);

        variables = {
	    id: id,
	    homeTeam: game["homeTeam"],
	    awayTeam: game["awayTeam"],
	    year: game["season"],
	    summary: "Game Summary",
	    stats: gameTable
        };
        response.render("game", variables);
    }
    else {
        response.send("Required year or id not sent")
    }
});

/* A nice error page */
app.use((error, request, response, next) => {
    /* internally log the stack trace */
    console.error(error.stack)

    variables = {
	message: error.message
    };
    response.status(500).render("error", variables);
})

/* start express :) */
app.listen(portNumber, (err) => {
    if (err) {
        console.log("Starting server failed.");
    }
});

/*
server-side console stuff
*/
process.stdin.setEncoding("utf8"); /* encoding */

/* Start message */
console.log(`Web server is running at http://${hostname}:${portNumber}`);

/* Prompt message. Reprints on every loop */
const prompt = "Type \"stop\" to shutdown the server: ";
console.log(prompt);

/* on() equivalent to addEventListener */
process.stdin.on("readable", () => {
    const dataInput = process.stdin.read();
    if (dataInput !== null) {
        const command = dataInput.trim();
        if (command === "stop") {
            console.log("Shutting down the server");
            process.exit(0);  /* exiting */
        }
        else {
            console.log(`Invalid command: "${command}"`);
        }
    }
    console.log(prompt);

    process.stdin.resume();
});

/*
MongoDB functions
*/

/* Create a MongoClient with a MongoClientOptions object to set the Stable API
  version */
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

/* Ping the server */
async function ping() {
    try {
        // Connect the client to the server (optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db(dbName).command({ ping: 1 });
        // console.log("MongoDB Connection Successful!");
    }
    finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
ping().catch(console.dir);

async function insertApplicant(client, applicant) {
    try {
        const db = await client.db(dbName);
        const collection = await db.collection(collectionName);

        const result = await collection.insertOne(applicant);

        return result
    }
    finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

async function clearSearchHistory(client, databaseAndCollection) {
    const result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .deleteMany({});
    return result.deletedCount;
}

async function getSearchHistory(client, databaseAndCollection) {
    let filter = {};
    const cursor = client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .find(filter);

    const result = await cursor.toArray();

    /* Add it to a big string in reverse order */
    let searchResults = "";
    for (let r of result) {
        searchResults = `<div class="results"><h2>${r.name}</h2>` +
                        `<br><p>${r.data}</p>"</div>"` +
                        searchResults;
    }

    return searchResults;
}

async function addSearch(client, databaseAndCollection, request) {
    await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .insertOne(request);
}
