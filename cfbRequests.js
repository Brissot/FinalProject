const cfb= require('cfb.js');

class cfbRequests {
    #defaultClient;
    #ApiKeyAuth;
    
    #bettingApi;
    #drivesApi;
    
    constructor(apiKey) {
	this.defaultClient= cfb.ApiClient.instance;

	/* key authorization */
	this.ApiKeyAuth= this.defaultClient.authentications['ApiKeyAuth'];
	this.ApiKeyAuth.apiKey= `Bearer ${apiKey}`;

	/* initialize the apis */
	this.bettingApi= new cfb.BettingApi();
	this.drivesApi= new cfb.DrivesApi();
    }

    async getBets(year, team) {
	const opts= {year: year, team: team, seasonType: "both"};

	try {
	    let data= await this.bettingApi.getLines(opts);

	    data.sort((first, second) => first.week - second.week);
	    
	    return data;
	}
	catch (error) {
	    throw("failed to retreive from betting api", error);
	}
    }

    async getDrives(year, team, week) {
	const opts= {conference: "Big Ten", week: week};

	try {
	    let data= await this.drivesApi.getDrives(56);
	    
	    console.log(data);
	    return data;
	}
	catch (error) {
	    throw("failed to retreive from drives api", error);
	}
    }

}

module.exports= { cfbRequests };
