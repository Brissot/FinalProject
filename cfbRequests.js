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

	    const headers= ["Week", "Season Type", "Start Date",
			    "Home Team", "Home Conference", "Home Score",
			    "Away Team", "Away Conference", "Away Score"];
	    const internalHeaders= ['id', 'season',
				    'week',           'seasonType',
				    'startDate',      'homeTeam',
				    'homeConference', 'homeScore',
				    'awayTeam',       'awayConference',
				    'awayScore',      'lines'];
	    
	    const data= this.formatBets(headers, internalHeaders, data);

	    return { headers, internalHeaders, data };
	}
	catch (error) {
	    throw ("failed to retreive from betting api", error);
	}
    }
    
    async formatBets(headers, internalHeaders, rawData) {
	let dict= {};
	for (let header of internalHeaders) {
	    dict[header]= []; /* initialize with empty dictionaries */
	}
	
	for (let rawDataDict of rawData) {
	    for (let header of internalHeaders) {
		dict[header]= dict[header].concat([rawDataDict[header]]);
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
	const opts = { 'minYear': 1869, 'maxYear': 2023}

	try {
	    let data = await this.matchupApi.getTeamMatchup(team1, team2, opts);

	    // console.log(data); 
	    return data;
	}
	catch (error) {
	    throw ("failed to retreive from drives api", error);
	}
    }
}

module.exports = { cfbRequests };
