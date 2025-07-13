// Import SDKs
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = 5100;
dotenv();

// Middlewares
app.use(express.json());
app.use(
	cors({
		origin: ["http://localhost:5173"],
	}),
);

// Database URI
const db_uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@professorcluster.rlegbqz.mongodb.net/?retryWrites=true&w=majority&appName=ProfessorCluster`;

// Database Client
const db_client = new MongoClient(db_uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

// Run APIs
const run_api = async () => {
	try {
		// Client connection with server (turn off in deployment)
		await db_client.connect();
		// Define database
		const db = db_client.db("tournext");
		// Define collections
		const usersColl = db.collection("users");
		const toursColl = db.collection("tours");
		//* API Routes
		// GET: Fetch all or filtered users
		app.get("/users", async (req, res) => {
			const query = {};
			const result = await usersColl.find(query).toArray();
			res.send(result);
		});
		// POST: Create & insert a user
		app.post("/users", async (req, res) => {
			const newUser = req.body;
			const result = await usersColl.insertOne(newUser);
			res.status(201).send(result);
		});
		// DELETE: Delete a user
		app.delete("/users/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await usersColl.deleteOne(query);
			res.status(204).send(result);
		});
		// GET: Fetch all or filtered tours
		app.get("/tours", async (req, res) => {
			const query = {};
			const result = await toursColl.find(query).toArray();
			res.send(result);
		});
		// Ping for successful connection confirmation
		await db_client.db("admin").command({ ping: 1 });
		console.log("Pinged. Connected to MongoDB!");
	} finally {
		// Don't close client connection with server
		// await client.close();
	}
};
run_api().catch(console.dir);

// Home route response
app.get("/", (req, res) => {
	res.send(
		'<h1 style="font-family: sans-serif; text-align: center;">TourNext is travelling with streamlined guide</h1>',
	);
});

// Listen to port
app.listen(port, () => {
	console.log(`Server is travelling on Port ${port}`);
});
