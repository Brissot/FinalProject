import express from 'express';

const router= express.Router();

router.get("/", (request, response) => {
    response.render("index");
});

router.get("/teamStats", (request, response) => {
    response.render("teamStats");
});

router.post("/teamStats", async (request, response) => {
    /* Get the required parameters out of the request body */
    let { team, year } = request.body;

    const table = null; //await cfbRadio.getBets(year, team);

    let variables = {
        team: team,
        year: year,
        stats: table,
        summary: `${ team } ${ year } Season`
    };
    request = {
        name: `Stats for ${ team } in ${ year }`,
        data: variables.stats
    };
    //await addSearch(client, databaseAndCollection, request);
    response.render("teamStatsResults", variables);
});

router.get("/team", async (request, response) => {
    /* Get the required parameters out of the request body */
    let team = request.query["q"];
    let year = 2024;
    const rawData = {}// await cfbRadio.getMatches(year, team);

    let teamConference;
    if (rawData[0].homeTeam === team)
        teamConference = rawData[0].homeConference;
    else
        teamConference = rawData[0].awayConference;

    console.log("hwat? " + teamConference);

    const conferenceInfo = {};//await cfbRadio.getTeam(teamConference);

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
        name: `Stats for ${ team } in ${ year }`,
        data: variables.stats
    };

    //await addSearch(client, databaseAndCollection, request);
    response.render("team", variables);
});

router.get("/teamHistory", (request, response) => {
    response.render("teamHistory");
});

router.post("/teamHistory", async (request, response) => {
    let { team1, team2 } = request.body;

    const matchupsInfo = {};// await cfbRadio.getMatchups(team1, team2);
    const [table, summary, record] = matchupsInfo;


    let variables = {
        team1: team1,
        team2: team2,
        summary: summary + '<br>' + record,
        data: table
    };
    request = {
        name: `${ team1 } vs ${ team2 } History`,
        data: `${ variables.summary } <br>${variables.data}`
    };
    //await addSearch(client, databaseAndCollection, request);
    response.render("teamHistoryResults", variables);
});

router.get("/searchHistory", async (request, response) => {
    const variables = {
        searches: {} //await getSearchHistory(client, databaseAndCollection)
    };
    response.render("searchHistory", variables);
});

router.post("/searchHistory", async (request, response) => {
    // await clearSearchHistory(client, databaseAndCollection)
    const variables = {
        searches: ""
    };
    response.render("searchHistory", variables);
});

router.get("/game", async (request, response) => {
    const { year, id } = request.query;

    if (year && id) {
        /* game. singular. object. */
        const [game, gameTable] = {} //await cfbRadio.getGame(year, id);

        const variables = {
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
        response.send("Required year or id not sent");
    }
});
