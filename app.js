/* Check .env Environmental Variables */
const path = require("path");
const bodyParser = require("body-parser");
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

let cfbRadio = new cfbRequests.cfbRequests(apiKey);

/*
  Website Logic goes here
*/

/**
   Creates a table with headers and data.

   headers: it's a list of strings. Don't overthink it. Though this is what we
   use in order to get the number of columns.

   data: an object of lists of strings.
 */
function createTable(headers, internalHeaders, data) {
    const strInnerHead = headers.reduce(
        (acc, header) =>
            acc + "<th>" + header + "</th>",
        ""
    );

    const strHead = "<thead><tr>" + strInnerHead + "</tr></thead>";

    let strBody = "<tbody>";
    if (data[internalHeaders[0]] != undefined) {
        /* data[internalHeaders[0]] is to get a length that exists */
        for (let i = data[internalHeaders[0]].length - 1; i >= 0; i--) {
            strBody = strBody + "<tr>";
            for (let header of internalHeaders) {
                strBody = strBody + "<td>" + data[header][i] + "</td>";
            }
            strBody = strBody + "</tr>";
        }
    }
    strBody = strBody + "</tbody>";

    let strTable = "<table>" + strHead + strBody + "</table>";

    return strTable;
}

/*
mongoDB stuff
*/
const databaseAndCollection = { db: dbName, collection: collectionName };
const uri = "mongodb+srv://" +
    username + ":" + password +
    "@sid-su.eczia3i.mongodb.net/" +
    "?retryWrites=true&w=majority&appName=Sid-Su";

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
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db(dbName).command({ ping: 1 });
        console.log("MongoDB Connection Successful!");
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

/*
express stuff 
*/
const app = express(); /* app is a request handler function */
app.use(
    '/favicon.ico',
    express.static("media/american-football-transparent.png")
);
app.use(express.static('css')); /* for css */
app.use(bodyParser.urlencoded({ extended: false }));

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
    let { team, year } = request.body;

    let dataTup = await cfbRadio.getBets(year, team);

    let headers = dataTup.headers;
    let internalHeaders = dataTup.internalHeaders;
    let data = dataTup.data;

    const table = createTable(headers, internalHeaders, data);

    let variables = {
        team: team,
        year: year,
        stats: table
    };
    request = {
        name: `Stats for ${team} in ${year}`,
        data: variables.stats
    };
    await addRequest(client, databaseAndCollection, request);
    response.render("teamStatsResults", variables);
});

app.get("/teamHistory", (request, response) => {
    response.render("teamHistory");
});

app.post("/teamHistory", async (request, response) => {
    let { team1, team2 } = request.body;

    matchupsInfo = await cfbRadio.getMatchups(team1, team2);
    [formattedGames, headings, summary, record] = matchupsInfo;

    let table = createTable(
        headings, Object.keys(formattedGames), formattedGames
    );

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
    await addRequest(client, databaseAndCollection, request);
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

/* start express :) */
app.listen(portNumber, (err) => {
    if (err) {
        console.log("Starting server failed.");
    }
    else {
        console.log(
            `Express server started on: http://localhost:${portNumber}`
        );
    }
});

/*
server-side console stuff
*/
process.stdin.setEncoding("utf8"); /* encoding */
console.log(`Web server is running at http://${hostname}:${portNumber}`);
const prompt = "Stop to shutdown the server: ";
process.stdout.write(prompt);

process.stdin.on('readable', () => {  /* on() equivalent to addEventListener */
    const dataInput = process.stdin.read();
    if (dataInput !== null) {
        const command = dataInput.trim();
        if (command === "stop") {
            console.log("Shutting down the server");
            process.exit(0);  /* exiting */
        }
        else {
            console.log(`Invalid command: ${command}`);
        }
    }
    process.stdout.write(prompt);
    process.stdin.resume();
});

/*
MongoDB functions
*/

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
    let searchResults = "";
    for (let r of result) {
        searchResults += `<h3>${r.name}<h3><br><p>${r.data}</p>`;
    }
    return searchResults;
}

async function addRequest(client, databaseAndCollection, request) {
    await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .insertOne(request);
}
