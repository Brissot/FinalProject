"use strict";

const key= `Bearer ` +
           "nFpsF84CcKRou0cJYl18Z/2XGzV88X4WxlFpKVm/M/W1Jq10zSsHOO0JRe5FPD4J";

const baseurl= "https://api.collegefootballdata.com/"
async function getTeam(team) {
    const reqHeaders= new Headers();
    reqHeaders.set("accept", "application/json");
    reqHeaders.set("Authorization", key);

    const req= await fetch(
        `${baseurl}games?year=2024&team=UMD`, {headers: reqHeaders});

    return req;
}

const r = await getTeam('Maryland');

console.log(await r.json());
