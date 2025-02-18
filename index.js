const express = require("express");
const bodyParser = require('body-parser');
const axios = require("axios");
const { MongoClient, ServerApiVersion } = require('mongodb'); // MongoClient lets us connect to our database

/* INITIALIZE DATABASE */
const uri = "mongodb+srv://daniel:devx-week4@cluster-test.xzfom.mongodb.net/?retryWrites=true&w=majority&appName=cluster-test"; // how we identify our database
const DB_NAME = "daniel";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
});

async function connectToDatabase() {
    try {
        console.log("Connecting to MongoDB...");
        await client.connect(); // connect to db
        await client.db(DB_NAME).command({ ping: 1 });
        console.log("Successfully connected!");
    } catch (error) {
        console.error("Database connection failed.");
        process.exit(1);
    }
}
connectToDatabase();

/* INITIALIZE SERVER */
const app = express();
const route = express.Router();
const port = process.env.PORT || 5001;


app.use(bodyParser.json()); // to parse the JSON in requests 
app.use(bodyParser.urlencoded({ extended: false })); // to parse URLs
app.use('/v1', route); // add the routes we make

app.listen(port, () => {    
  console.log(`Server listening on port ${port}`);
});


/* ACCESS DATABASE */
async function insertUser (newUser) {
    try {
        const usersCollection = client.db(DB_NAME).collection("users");
        const result = await usersCollection.insertOne(newUser);

        return await usersCollection.findOne({ _id: result.insertedId });
    } catch (error) {
        console.error("Error inserting user into the database:", error);
        throw error;
    }
};

async function getAllUsers () {
    // get user collection and find all users
    const usersCollection = client.db(DB_NAME).collection("users");
    return await usersCollection.find().toArray();
};

/* WEEK 4: DATABASE ROUTES */
route.post('/users', async (req, res) => {
    try {
        const newUser = req.body;
        if (!newUser || Object.keys(newUser).length === 0) {
            return res.status(400).json({ error: "Invalid user data" });
        }

        const createdUser = await insertUser(newUser);
        console.log("Inserted new user:", createdUser);
        res.status(201).json(createdUser);
    } catch (error) {
        console.error("Failed to create a new user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

route.get('/users', async (req, res) => {
    try {
        const users = await getAllUsers(); // get users
    
        console.log("Fetched users:", users);
        res.status(200).json(users);
    } catch (error) {
        console.error("Failed to fetch all users:", error);
        res.status(500).json({ error: message });
    }
});


/* OLD ROUTES */
// static GET
route.get('/simple-get', (req, res) => {
  res.send("here");
});

// dynamic GET (response is based on data in request)
route.get('/dynamic-get', (req, res) => {
  res.send(req.body.inputString);
});

// external API
route.get('/pokemon/:name', async (req, res) => {
  const pokemonName = req.params.name.toLowerCase(); // we extract data from the request

  try {
    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
    
    // store data from the API response
    const pokemonData = {
      name: response.data.name,
      id: response.data.id,
      height: response.data.height,
      weight: response.data.weight,
    };

    res.json(pokemonData);
  } catch (error) {
    res.status(404).send({ error: "Pokémon not found!" });
  }
});

