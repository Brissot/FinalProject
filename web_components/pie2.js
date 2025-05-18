let canvas = document.getElementById("pi");
let context = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 200;

canvas.style.background = "#90EE90";

context.font = "12pt sans serif";

/* create nice text */
const teams = [
    ["Maryland", "red"],
    ["Virginia", "blue"],
    ["Penn State", "blue"],
    ["Notre Dame", "green"],
    ["Alabama", "red"],
    ["Georgia", "crimson"],
    ["Texas", "orange"]
]
const N = teams.length;

/* for each team, draw the dot and the team name */
teams.reduce(
    (height, team_info) => {
	[team, color] = team_info;

	context.fillStyle = color
	context.fillRect(220, height, 5, 5);
	context.fillText(team, 240, height + 8);

	return height + canvas.height / (N + 1);
    },
    canvas.height / (N + 1)
);
