/* Check Arguments */
if (process.argv.length !== 3) {
  console.error("Usage app.js <port number>");
  process.exit(1);
}
/* retrieve argument. if deployed, make hostname retrieval more dynamic */
const portNumber= process.argv[2];
const hostname= "localhost";

/* Check .env Environmental Variables */
const path= require("path");
require("dotenv").config({
  path: path.resolve(__dirname, '.env')
});

/* Get the Environmental Variables out */
const username = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const dbName = process.env.MONGO_DB_NAME;
const collectionName = process.env.MONGO_COLLECTION;
const apiKey = process.env.CFB_API_KEY;

const cfbRequests= require("./cfbRequests");
let cfbRadio= new cfbRequests.cfbRequests(apiKey);
let data;
cfbRadio.getBets(2023, "Maryland")
    .then(data => {
	for (let game of data) {
	    console.log("here", game);
	}
    })
    .catch(error => console.error(error));

// let info;
// let many = new cfbRequests.cfbRequests(apiKey);
// many.getMatchups("Penn State", "Maryland")
//     .then(info => console.log(info))
//     .catch(error => console.error(error));
// console.log(info);


const { symbolicEqual }= require('mathjs');
console.log(symbolicEqual("tan(x)", "sin(x)/cos(x)"));
console.log(symbolicEqual("cos(x)^2 + sin(x)^2", "1"));
console.log(symbolicEqual("x^2 + x + 1", "1 + x + x^2"));
/*
  Website Logic goes here
*/

/**
   Creates a table with headers and data.

   headers: it's a list of strings. Don't overthink it. Though this is what we
   use in order to get the number of columns.

   data: a list of lists of strings.
 */
function createTable(headers, data) {
    const strInnerHead= headers.reduce(
	(acc, header) => acc + "<th>" + header + "</th>", "");
    const strHead= "<thead><tr>" + strInnerHead + "</tr></thead>";


    let strBody= "<tbody>";
    for (let i= 0; i < data[0].length; i++) {
	strBody= strBody + "<tr>";
	for (let j= 0; j < headers.length; j++) {
	    strBody= strBody + "<td>" + data[j][i] +"</td>";
	}
	strBody= strBody + "</tr>";
    }
    strBody= strBody + "</tbody>";

    let strTable= "<table>" + strHead + strBody + "</table>";

    return strTable;
}

/* test of createTable() */
// t= createTable(["hi", "hii", "hiii"], [["hello","hallo"], ["hey","heyy"],["sup","suh"]]);
// console.log(t);

/*
mongoDB stuff
*/
const {MongoClient, ServerApiVersion}= require('mongodb');
const uri= "mongodb+srv://" +
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

/* Ping the server*/
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
    await client.close();
  }
}
ping().catch(console.dir);

async function insertApplicant(client, applicant) {
  try {
    const db= await client.db(dbName);
    const collection= await db.collection(collectionName);

    const result= await collection.insertOne(applicant);

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
const express= require("express"); /* Accessing express module */
const app= express(); /* app is a request handler function */
app.use(express.static('css')); /* for css */

/* directory where templates will reside */
app.set("views", path.resolve(__dirname, "templates"));
/* view/templating engine */
app.set("view engine", "ejs");

app.get("/", (request, response) => {
    response.render("index");
});

app.get("/teamStats", (request, response) => {
  response.render("teamStats");
});

app.post("/teamStats", (request, response) => {
  variables = {
    
  }
  response.render("teamStatsResults", variables);
});

app.get("/teamHistory", (request, response) => {
  response.render("teamHistory");
});

app.post("/teamHistory", (request, response) => {
  response.render("teamHistoryResults");
});

app.get("/searchHistory", (request, response) => {
  response.render("searchHistory");
});

/*
  Add more routes here
*/


/* start express :) */
app.listen(portNumber, (err) => {
  if (err) {
    console.log("Starting server failed.");
  }
  else {
    console.log(`Express server started on: http://localhost:${portNumber}`);
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
	const dataInput= process.stdin.read();
	if (dataInput !== null) {
		const command= dataInput.trim();
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
