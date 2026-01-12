import sqlite from 'node:sqlite';

const database = new sqlite.DatabaseSync(':memory:');
database.exec(`
    CREATE TABLE app_user(
        username TEXT PRIMARY KEY,
        password TEXT
    ) STRICT
`);

database.exec(`
    CREATE TABLE app_group(
        group_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        group_name TEXT
    ) STRICT
`);

database.exec(`
    CREATE TABLE app_user_group(
        user_group_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        username TEXT,
        group_id INTEGER,
        FOREIGN KEY(username) REFERENCES app_user(username),
        FOREIGN KEY(group_id) REFERENCES app_group(group_id)
    ) STRICT`
);

database.exec(`
    CREATE TABLE app_user_group_parent(
        slave_role_id INTEGER,
        master_role_id INTEGER,
        FOREIGN KEY(slave_role_id) REFERENCES app_user_group(user_group_id),
        FOREIGN KEY(master_role_id) REFERENCES app_user_group(user_group_id)
    ) STRICT`
);

/**
 * Enum for groups
 * @readonly
 * @enum {string}
 */
const Groups = Object.freeze({
    EMPLOYEE: "EMPLOYEE",
    OVERSEER: "OVERSEER",
    DIRECTOR: "DIRECTOR"
});

const insert = database.prepare("INSERT INTO app_user (username, password) VALUES (?, ?);");
const insert2 = database.prepare("INSERT INTO app_group (group_name) VALUES (?);");
const insert3 = database.prepare("INSERT INTO app_user_group (username, group_id) VALUES (?, ?);");
const insert4 = database.prepare("INSERT INTO app_user_group_parent (slave_role_id, master_role_id) VALUES (?, ?)");
insert2.run(Groups.EMPLOYEE);
insert2.run(Groups.OVERSEER);
insert2.run(Groups.DIRECTOR);
insert.run("ted", "1234");
insert.run("egirl", "1234");
insert3.run("egirl", 1);
insert3.run("egirl", 2);
insert3.run("egirl", 3);
insert3.run("ted", 1);
insert4.run(2, 3);

//insert2.run("employee");

class User {
    constructor({ username, password }) {
        this.username = username;
        this.password = password;
    }

    /** @constructor @param {UserRow} userRow */
    static fromUserRow(userRow) {
        this.username = userRow.username;
        this.password = userRow.password;

        return new User(userRow);
    }
}

/**
 * @typedef {Object} UserRow
 * @property {string} username
 * @property {string} password
 */

const query = database.prepare("SELECT * FROM app_user");
const query2 = database.prepare("SELECT * FROM app_group");
const query5 = database.prepare("SELECT * FROM app_user_group");
console.log(query5.all());

/** @type {User[]} */
const res = query.all().map(row => User.fromUserRow(row));

const res2 = query2.all();
console.log(res);
console.log(res2);

console.log(database.prepare("SELECT * FROM app_user_group").all());
const query3 = database.prepare(`
    SELECT a.user_group_id, a.username, b.group_name
    FROM app_user_group as a
    LEFT JOIN app_group as b
    ON a.group_id = b.group_id`);

console.log(query3.get(), "woo");
