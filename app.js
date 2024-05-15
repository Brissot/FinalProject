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
})  ;

/* Get the Environmental Variables out */
const username= process.env.MONGO_DB_USERNAME;
const password= process.env.MONGO_DB_PASSWORD;
const dbName= process.env.MONGO_DB_NAME;
const collectionName= process.env.MONGO_COLLECTION;
const apiKey= process.env.CFB_API_KEY;

const cfbRequests= require("./cfbRequests");
let cfbRadio= new cfbRequests.cfbRequests(apiKey);
let data;
cfbRadio.getBets(2023, "Maryland")
    .then(data => console.log(data))
    .catch(error => console.error(error));
console.log(data);

const { symbolicEqual }= require('mathjs');
console.log(symbolicEqual("tan(x)", "sin(x)/cos(x)"));
console.log(symbolicEqual("cos(x)^2 + sin(x)^2", "1"));
console.log(symbolicEqual("x^2 + x + 1", "1 + x + x^2"));
/*
  Website Logic goes here
*/

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
    
    variables= {mathProblem: "x^2 + 2x + 1"};
    response.render("index", variables);
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
