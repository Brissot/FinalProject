const cfb = require('cfb.js');

class cfbRequests {
    #defaultClient;
    #ApiKeyAuth;

    #bettingApi;
    #drivesApi;

    constructor(apiKey) {
        this.defaultClient = cfb.ApiClient.instance;

        /* key authorization */
        this.ApiKeyAuth = this.defaultClient.authentications['ApiKeyAuth'];
        this.ApiKeyAuth.apiKey = `Bearer ${apiKey}`;

        /* initialize the apis */
        this.bettingApi = new cfb.BettingApi();
        this.drivesApi = new cfb.DrivesApi();
        this.matchupApi = new cfb.TeamsApi();
    }

    async getBets(year, team) {
        const opts = { year: year, team: team, seasonType: "both" };

        try {
            const rawData = await this.bettingApi.getLines(opts);

            rawData.sort((first, second) => first.week - second.week);

            const headers = ["Week", "Season Type",
                "Start Date", "Home Team",
                "Home Conference", "Home Score",
                "Away Team", "Away Conference",
                "Away Score"];
            const internalHeaders = ['week', 'seasonType',
                'startDate', 'homeTeam',
                'homeConference', 'homeScore',
                'awayTeam', 'awayConference',
                'awayScore'];

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
        let dict = {};
        for (let header of internalHeaders) {
            dict[header] = []; /* initialize with empty dictionaries */
        }

        for (let rawDataDict of rawData) {
            for (let header of internalHeaders) {
                dict[header] = dict[header].concat([rawDataDict[header]]);
            }
        }

        return dict;
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
                    if (game["neutralSite"])
                        game["neutralSite"] = "Yes";
                    else
                        game["neutralSite"] = "No";

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
                        game["venue"] = "unknown";

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

module.exports = { cfbRequests };
