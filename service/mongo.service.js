import mongodb from 'mongodb';

const MongoClient = mongodb.MongoClient;
const ServerApiVersion = mongodb.ServerApiVersion;

/* Get the Environmental Variables out */
const username = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const dbName = process.env.MONGO_DB_NAME;
const collectionName = process.env.MONGO_COLLECTION;

/* MongoDB Environmental Variables */
const databaseAndCollection = { db: dbName, collection: collectionName };
const uri = "mongodb+srv://" +
    username + ":" + password +
    "@sid-su.eczia3i.mongodb.net/" +
    "?retryWrites=true&w=majority&appName=Sid-Su";

/* MongoDB functions */
// /* Create a MongoClient with a MongoClientOptions object to set the Stable API  version */
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

/* Ping the server */
async function ping() {
    try {
        // Connect the client to the server (optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db(dbName).command({ ping: 1 });
        console.log("MongoDB Connection Successful!");
    }
    finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}
ping().catch(console.dir);

async function insertApplicant(client, applicant) {
    try {
        const db = await client.db(dbName);
        const collection = await db.collection(collectionName);

        const result = await collection.insertOne(applicant);

        return result;
    }
    finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

async function clearSearchHistory(client, databaseAndCollection) {
    const result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .deleteMany({});
    return result.deletedCount;
}

async function getSearchHistory(client, databaseAndCollection) {
    let filter = {};
    const cursor = client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .find(filter);

    const result = await cursor.toArray();

    /* Add it to a big string in reverse order */
    let searchResults = "";
    for (let r of result) {
        searchResults = `<div class="results"><h2>${r.name}</h2>` +
            `<br><p>${r.data}</p>"</div>"` +
            searchResults;
    }

    return searchResults;
}

async function addSearch(client, databaseAndCollection, request) {
    await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .insertOne(request);
}

export {insertApplicant, clearSearchHistory, getSearchHistory, addSearch};