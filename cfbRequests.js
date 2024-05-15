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
			let data = await this.bettingApi.getLines(opts);

			data.sort((first, second) => first.week - second.week);

			return data;
		}
		catch (error) {
			throw ("failed to retreive from betting api", error);
		}
	}

	async getDrives(year, team, week) {
		const opts = { conference: "Big Ten", week: week };

		try {
			let data = await this.drivesApi.getDrives(56);

			console.log(data);
			return data;
		}
		catch (error) {
			throw ("failed to retreive from drives api", error);
		}
	}


	async getMatchups(team1, team2) {
		const opts = { 'minYear': 1869, 'maxYear': 2023 }

		try {
			let data = await this.matchupApi.getTeamMatchup(team1, team2, opts);
			return this.formatGames(data.games)
		}

		catch (error) {
			throw ("failed to retreive from drives api", error);
		}
	}

	formatGames(rawData) {
		if (rawData.length != 0) {
			let dictionary = {};
			console.log(Object.keys(rawData[0]));
			for (let key of Object.keys(rawData[0])) {
				dictionary[key] = [];
			}
			for (let game in rawData) {
				for (let key in Object.keys(dictionary[0])) {
					dictionary[key].add(game[key]);
				}
			}
			return dictionary;

		} else {
			return {};
		}
	}
}

module.exports = { cfbRequests };
