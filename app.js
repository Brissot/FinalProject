import express from 'express';
import searchPage from './controller/web/search.controller.js';
import actuator from './controller/api/actuator.controller..js';

// initialize express (app is a request handler function)
const app = express();

// statik endpoints
app.use("/favicon.ico", express.static("media/american-football-transparent.png", { maxAge: '30d' }));
app.use(express.static('css', { maxAge: '30d' }));
app.use("/media", express.static("media", { maxAge: '30d' }));

// configure express
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* directory where templates will reside */ /* view/templating engine */
app.set("views", "views");
app.set("view engine", "ejs");

/** put the routers together */
app.use(searchPage);
app.use("/actuator", actuator);

/* A nice error page */
app.use((error, request, response, next) => {
    /* internally log the stack trace */
    console.error(error.stack);

    const variables = {
        message: error.message
    };
    response.status(500).render("error", variables);
});

/* start express :) */
const portNumber= process.env.PORT;
app.listen(portNumber, (err) => {
    if (err) {
        console.log("Starting server failed.");
    }
});

/** server-side console stuff */
process.stdin.setEncoding("utf8");

const hostname= 'localhost';
/** start message :) */
console.log(`Web server is running at http://${hostname}:${portNumber}`);

/** Prompt message. Reprints on every loop */
const prompt = "Type \"stop\" to shutdown the server: ";
console.log(prompt);

/** on() equivalent to addEventListener. so the console works */
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
