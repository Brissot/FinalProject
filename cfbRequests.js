const cfbAPI = require('cfb.js');


class cfbRequests {
    #defaultClient;
    #ApiKeyAuth;

    #bettingApi;
    #drivesApi;
    #gamesApi;

    constructor(apiKey) {
        this.defaultClient = cfbAPI.ApiClient.instance;

        /* key authorization */
        this.ApiKeyAuth = this.defaultClient.authentications['ApiKeyAuth'];
        this.ApiKeyAuth.apiKey = `Bearer ${apiKey}`;

        /* initialize the apis */
        this.bettingApi = new cfbAPI.BettingApi();
        this.drivesApi = new cfbAPI.DrivesApi();
        this.matchupApi = new cfbAPI.TeamsApi();
        this.gamesApi = new cfbAPI.GamesApi();
    }


    async getGame(year, gameId) {
        const opts = { "id": gameId };

        try {
            const ret = this.gamesApi.getGames(year, opts);
            return ret
        } catch(error) {
            console.log("Failed to get game " + gameId + "\n\n" + e);
        }

    }

    async getBets(year, team) {
        const opts = { year: year, team: team, seasonType: "both" };

        try {
            const rawData = await this.bettingApi.getLines(opts);

            console.log(JSON.stringify(rawData, null, 2));
            rawData.sort((first, second) => first.week - second.week);

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

            const data = await this.formatBets(
                headers, internalHeaders, rawData
            );

            return { headers, internalHeaders, data };
        }
        catch (error) {
            throw ("failed to retreive from betting api", error);
        }
    }

    async formatBets(headers, internalHeaders, rawData) {
        let newBetsObj = {};
        for (let header of internalHeaders) {
            newBetsObj[header] = []; /* initialize with empty objects */
        }

        for (let rawDataDict of rawData) {
            for (let header of internalHeaders) {
                newBetsObj[header] = newBetsObj[header].concat([rawDataDict[header]]);
            }
        }

        // newBetsObj["id"] = newBetsObj["id"].map((id) => {
        //     `http://localhost:5000/games?id=${id}?year=2024`
        // });

        // console.log("aoeu" + JSON.stringify(newBetsObj["id"]);
        for (let i=0; i < newBetsObj["id"].length; i++) {
            newBetsObj["id"][i] = `<a href=./game?year=2024&id=${newBetsObj["id"][i]}>${newBetsObj["id"][i]}</a>`
        }

        return newBetsObj;
    }


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


    async getMatchups(team1, team2) {
        const opts = { 'minYear': 1869, 'maxYear': 2024 }
        const headings = [
            "Season",
            "Week",
            "Game Type",
            "Date",
            "Neutral Site",
            "Venue",
            "Home Team",
            "Home Score",
            "Away Team",
            "Away Score",
            "Winner"
        ];

        try {
            /* get the data from the cfb api */
            let data = await this.matchupApi.getTeamMatchup(
                team1, team2, opts
            );

            /* format the games
                formatted as an object, with internalHeaders keys and an array
                of game values */
            let formattedGames = this.formatGames(data.games);

            /* print the number of games gotten */
            let numGames = 0;
            if ("season" in formattedGames)
                numGames = formattedGames["season"].length;
            console.log("Got " + numGames + " Matches Played");

            let summary = `${team1} vs. ${team2}`;
            let record = "Overall Record: " +
                `${data.team1Wins} (${team1}) - ${data.team2Wins} (${team2})`
            
            return [formattedGames, headings, summary, record];
        }

        catch (error) {
            console.log("failed to retreive from drives api:", error);

            return [{}, headings, `${team1} vs. ${team2}`, "No Matches Found"];
        }
    }

    /* formats the games for matchup data */
    formatGames(rawData) {
        if (rawData.length !== 0) {
            let dictionary = {};
            for (let key of Object.keys(rawData[0])) {
                dictionary[key] = [];
            }
            for (let key of Object.keys(dictionary)) {
                /* iterate through each game in raw data, and make things more
                    human readable */
                for (let game of rawData) {
                    if (game["winner"] === null) {
                        game["winner"] = "Tie";
                    }
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

                    // Convert to a Date object
                    const date = new Date(game["date"]);

                    // Format the date
                    const opts = {
                        year: 'numeric',
                        month: 'short', // for abbreviated month like "Oct."
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true, // For 12-hour format with AM/PM
                    };

                    const formatter = new Intl.DateTimeFormat('en-US', opts);
                    const formattedDate = formatter.format(date);

                    game["date"] = formattedDate;

                    // fix null venues
                    if (game["venue"] === null)
                        game["venue"] = "-";

                    /* If the key already exists, don't do anything, else put
                        game in */
                    dictionary[key] = dictionary[key] != [] ?
                        [...dictionary[key], game[key]] : [game[key]];
                }
            }

            return dictionary;

        } else {
            return {};
        }
    }
}

class cfbFormatter {
}

module.exports = { cfbRequests };
