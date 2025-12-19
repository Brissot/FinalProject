"use strict";

const baseurl= "https://api.collegefootballdata.com/"
const key= `Bearer ` +
           "nFpsF84CcKRou0cJYl18Z/2XGzV88X4WxlFpKVm/M/W1Jq10zSsHOO0JRe5FPD4J"
async function getTeam(team) {
    const reqHeaders= new Headers();
    reqHeaders.set("accept", "application/json");
    reqHeaders.set("Authorization", key);

    const req= await fetch(
        `${baseurl}games?year=2024&team=UMD`, {headers: reqHeaders});

    const data= r.json();

    return data;
}

const r = await getTeam('Maryland');

console.log(await r.json());
