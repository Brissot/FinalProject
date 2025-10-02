/** cfbRequests.js
 * File that includes a class that handles both getting the college football
 * stats (through the cfb.js API), and formatting the college football stats
 * into HTML
 */
const cfbAPI = require('cfb.js');


/**
 * The main class that handles getting from cfb.js and formatting it in a nice
 * way, so that the express app in app.js can display it :)
 */
class cfbRequests {
    #defaultClient;
    #ApiKeyAuth;

    #bettingApi;
    #drivesApi;
    #matchApi;
    #gamesApi;

    #dateFormatter

    /**
     * Constructor that seeks to pre-allocate as much as possible
     *
     * @param {string} - Bearer key from https://collegefootballdata.com
     */
    constructor(apiKey) {
        /* API instance */
        this.defaultClient = cfbAPI.ApiClient.instance;

        /* key authorization */
        this.ApiKeyAuth = this.defaultClient.authentications['ApiKeyAuth'];
        this.ApiKeyAuth.apiKey = `Bearer ${apiKey}`;

        /* initialize the apis */
        this.bettingApi = new cfbAPI.BettingApi();
        this.drivesApi = new cfbAPI.DrivesApi();
        this.matchupApi = new cfbAPI.TeamsApi();
        this.gamesApi = new cfbAPI.GamesApi();

        /* formatter for the date ex. "Dec. 9, 2024. 10:23PM" */
        const opts = {
            year: 'numeric',
            month: 'short', // for abbreviated month like "Oct."
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true, // For 12-hour format with AM/PM
        };
        this.dateFormatter = new Intl.DateTimeFormat('en-US', opts);
    }

    /**
     * Method to get a game by ID. Note that the year parameter is not
     * necessary in the raw API, but is in the cfb.js API, so we're passing
     * years around all day
     *
     * Documentation for the endpoint:
     * https://github.com/CFBD/cfb.js/blob/master/docs/GamesApi.md#getgames
     *
     * @param {number} year - The year the game was played
     * @param {number} gameId - The gameID itself
     * @returns {string} - An HTML string that displays things nicely
     */
    async getGame(year, gameId) {
        /* prepare options */
        const opts = { "id": gameId };

	let gamesArray, game;
        /* get the game */
        try {
            /* get the game from cfb.js */
            gamesArray = await this.gamesApi.getGames(year, opts);
            game = gamesArray[0]; /* only looking for the 1 id */
	} catch (error) {
	    throw new Error(
		"Failed to get game with id " + gameId + " from the CFB API"
	    );
	}

	try {
            /* format the game */

	    /* sometimes startDate doesn't exist now */
	    if (game["startDate"]) {
                game["startDate"] = this.isoToHuman(game["startDate"]);
            }

            /* Create a table */
            let gameTable = "<table>";
            for (let key of Object.keys(game)) {
		if (game[key] == null) {
		    game[key] = "-";
		}

                gameTable =
                    gameTable +
                    `<tr><th>${key}</th>` +
                    `<td>${game[key]}</td></tr>`
            }
            gameTable = gameTable + "</table>";

            /* Return both the game and the table we made. Note that this gets
                its own table function, because we want this one to be vertical
                */
            return [ game, gameTable ];
        } catch(error) {
	    throw new Error("Failed to format game with id " + gameId);
        }
    }

    /**
     * Method to get the season of a team (I know it's the wrong endpoint, it's
     * on my to-do list. It also is an endpoint that consistantly works, so...
     *
     * It goes from querying cfb.js, to formatting cfb.js, to creating an
     * HTML-style table
     *
     * @param {number} year - the year we want to get
     * @param {string} team - the name of the team we want to get
     * @returns {string} - returns an HTML-formatted table
     */
    async getBets(year, team) {
        const opts = { year: year, team: team, seasonType: "both" };

        /* Header and HTML step. Order matters, these match up by index */
        const headers = ["Week", "Season Type",
                         "Start Date", "Home Team",
                         "Home Conference", "Home Score",
                         "Away Team", "Away Conference",
                         "Away Score", "ID"];
        const internalHeaders = ['week', 'seasonType',
                                 'startDate', 'homeTeam',
                                 'homeConference', 'homeScore',
                                 'awayTeam', 'awayConference',
                                 'awayScore', "id"];

        try {
            /* get the data from cfb.js */
            const rawData = await this.bettingApi.getLines(opts);

            /* What did we get? */
            console.log(year, team, "Season: Got", rawData.length);

            /* Sort the data into reverse chronological order (recent games) */
            await rawData.sort((first, second) => second.week - first.week);

            /* Formatting step. Note that this is N*Columns function calls. I
               am hoping that the compiler makes it okay */
            for (let game of rawData) {
                /* Human readable times */
                game["startDate"] = this.isoToHuman(game["startDate"]);

                /* Add hyperlinks instead of a raw ID */
                game["id"] = this.idToHyperlink(game["id"], year)
            }

            const table = this.createTable(headers, internalHeaders, rawData);

            return table;
        }
        catch (error) {
            console.log("Betting API: Failed to retreive data:", error);
        }
    }

        /**
     * Method to get the season of a team (I know it's the wrong endpoint, it's
     * on my to-do list. It also is an endpoint that consistantly works, so...
     *
     * It goes from querying cfb.js, to formatting cfb.js, to creating an
     * HTML-style table
     *
     * @param {number} year - the year we want to get
     * @param {string} team - the name of the team we want to get
     * @returns {string} - returns an HTML-formatted table
     */
    async getTeam(year, team) {
        const opts = { year: year, team: team, seasonType: "both" };

        try {
            /* get the data from cfb.js */
            const baseurl= "https://api.collegefootballdata.com/"
            const reqHeaders= new Headers();
            reqHeaders.set("accept", "application/json");
            reqHeaders.set("Authorization", this.ApiKeyAuth.apiKey);

            const req= await fetch(
                `${baseurl}games?year=2023&team=${team}`, {headers: reqHeaders});

            const rawData= await req.json();

            console.log(rawData);
            /*const rawData = await this.bettingApi.getLines(opts);*/

            /* What did we get? */
            console.log(year, team, "Season: Got", rawData.length);

            /* Sort into reverse chronological order (recent games first) */
            await rawData.sort((first, second) => second.week - first.week);

            /* Formatting step. Note that this is N*Columns function calls. I
               am hoping that the compiler makes it okay */
            for (let game of rawData) {
                /* Human readable times */
                game["startDate"] = this.isoToHuman(game["startDate"]);

                /* Add hyperlinks instead of a raw ID */
                game["id"] = this.idToHyperlink(game["id"], year)
            }

            return rawData;
        }
        catch (error) {
            console.log("Betting API: Failed to retreive data:", error);
        }
    }

    /* Not currently used. Probably doesn't work */
    async getDrives(year, team, week) {
        const opts = { conference: "Big Ten", week: week };

        try {
            let data = await this.drivesApi.getDrives(56);

            // console.log(data);
            return data;
        }
        catch (error) {
            throw ("failed to retreive from drives api", error);
        }
    }


    /**
     * Method to get all matchups with the name of both teams
     *
     * Goes from query cfb.js, to formatting properties, to generating an HTML-
     * style table string
     *
     * @param {string} team1 - the name of the first team
     * @param {string} team2 - the name of the second team
     * @returns {Object<string>} A triple of table, summary of record. All
     * strings
     */
    async getMatchups(team1, team2) {
        const opts = { 'minYear': 1869, 'maxYear': 2024 }
        const headers = [
            "Season", "Week",
            "Game Type", "Date",
            "Neutral Site", "Venue",
            "Home Team", "Home Score",
            "Away Team", "Away Score",
            "Winner"
        ];
        const internalHeaders = [
            "season", "week",
            "seasonType", "date",
            "neutralSite", "venue",
            "homeTeam", "homeScore",
            "awayTeam", "awayScore",
            "winner"
        ];

        try {
            /* get the data from the cfb.js */
            let rawData = await this.matchupApi.getTeamMatchup(
                team1, team2, opts
            );

            /* What did we get? */
            console.log(`${team1} vs ${team2}: Got`,
                        rawData["games"].length
            );

            rawData["games"].sort(
                (first, second) => second.season - first.season
            );

            /* format the games */
            for (let game of rawData["games"]) {
                if (game["winner"] === null)
                    game["winner"] = "Tie";

                /* For some reason the post-conversion game["neutralSite"]
                   comes through sometimes */
                if (game["neutralSite"] === true ||
                    game["neutralSite"] === "Yes") {
                    game["neutralSite"] = "Yes";
                }
                else if (game["neutralSite"] === false ||
                         game["neutralSite"] === "No") {
                    game["neutralSite"] = "No";
                }
                else
                    game["neutralSite"] = "-";

                // fix null venues
                if (game["venue"] === null)
                    game["venue"] = "-";

                game["date"] = this.isoToHuman(game["date"]);
            }

            /* create a nice table that can be rendered on the frontend */
            const table = this.createTable(
                headers, internalHeaders, rawData["games"]
            );

            let summary = `${team1} vs. ${team2}`;
            let record = "Overall Record: " +
                         `${rawData.team1Wins} (${team1}) - ` +
                         `${rawData.team2Wins} (${team2})`

                   return [table, summary, record];
        }

        catch (error) {
            console.log("Failed to retrieve from matchups api:", error);

            return [{}, `${team1} vs. ${team2}`, "No Matches Found"];
        }
    }


    /**
     * Converts ISO time to human time, so we can read it more easily.
     *
     * Note that this function is intentionally left synchronous, because the
     * overhead of async is bigger than the function
     *
     * @param {string} isoTime - the time represented in ISO time, for instance
     *                      2024-12-09T15:29:29-05:00
     * @returns {string} - formatted human readable time. Above time is
     *                      Dec. 9, 2024. 3:29PM
     */
    isoToHuman(isoTime) {
        /* Convert the string isoTime to a JS date object*/
        const date = new Date(isoTime);

        /* format the date */
        const formattedDate = this.dateFormatter.format(date);

        return formattedDate
    }

    /**
     * Converts a gameId and year into a hyperlink to the game with that gameId
     *
     * Note that this function is intentionally left synchronous, because the
     * overhead of async is bigger than the function
     *
     * @param {number} id - The gameId we would like to convert
     * @param {number} year - The year the game was played. This is necessary
     *                  presumably because of a mistake when making cfb.js
     *
     * @returns {string} - An HTML-formatted hyperlink to the game-by-id
     *                  endpoint
     */
    idToHyperlink(id, year) {
        return `<a href=./game?year=${year}&id=${id}>${id}</a>`;
    }

    /**
     * Creates a table with headers and data.
     *
     * @param {Array<string>} headers - it's an array of human-readable
     * strings. This is what we use to determine which headers are "on" (the
     * full output can be quite long)
     *
     * @param {Array<string>} internalHeaders - it's an array of strings that
     * can be used to access the each property for each element in the data
     * array
     *
     * @param {Array<Object>} data - an array of matches objects. Properties
     * are read out based on headers and internalHeaders
     */
    createTable(headers, internalHeaders, data) {
        const strInnerHead = headers.reduce(
            (acc, header) =>
                acc + "<th>" + header + "</th>",
            ""
        )
        const strHead = "<thead><tr>" + strInnerHead + "</tr></thead>";

        let strBody = "<tbody>"
        for (let game of data) {
            strBody = strBody + "<tr>";
            for (let header of internalHeaders) {
                strBody = strBody + "<td>" + game[header] + "</td>";
            }
            strBody = strBody + "</tr>";
        }
        strBody = strBody + "</tbody>";

        const strTable = "<table>" + strHead + strBody + "</table>";

        return strTable;
    }
}

module.exports = { cfbRequests };
