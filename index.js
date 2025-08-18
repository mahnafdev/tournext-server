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
		origin: ["http://localhost:5173", "https://tournext-ada60.web.app"],
		credentials: true,
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
		const bookingsColl = db.collection("bookings");
		const tourGuidesColl = db.collection("tour_guides");
		const storiesColl = db.collection("stories");
		//* API Routes
		// GET: Fetch all or filtered users
		app.get("/users", async (req, res) => {
			const { email, role, search } = req.query;
			const query = {};
			email ? (query.email = email) : query;
			role ? (query.role = role) : query;
			if (search) {
				query.$or = [
					{ full_name: { $regex: search, $options: "i" } },
					{ email: { $regex: search, $options: "i" } },
				];
			}
			const result = await usersColl.find(query).toArray();
			res.send(result);
		});
		// POST: Create & insert a user
		app.post("/users", async (req, res) => {
			const newUser = req.body;
			const { email } = newUser;
			const isUserExists = await usersColl.findOne({ email });
			if (isUserExists) return res.send({ inserted: false });
			const result = await usersColl.insertOne(newUser);
			res.status(201).send(result);
		});
		// PATCH: Accept an User as Tour Guide
		app.patch("/accept-tour-guide", async (req, res) => {
			const { user_email, guide_id, status } = req.body;
			const updateUser = await usersColl.updateOne(
				{ email: user_email },
				{ $set: { role: "Tour Guide" } },
			);
			const updateGuide = await tourGuidesColl.updateOne(
				{ guide_id },
				{ $set: { status: "accepted" } },
			);
			res.send({
				updateUser,
				updateGuide,
			});
		});
		// PATCH: Reject an User as Tour Guide
		app.patch("/reject-tour-guide/:guide_id", async (req, res) => {
			const { guide_id } = req.params;
			const updatedGuide = await tourGuidesColl.updateOne(
				{ guide_id },
				{ $set: { status: "rejected" } },
			);
			res.send(updatedGuide);
		});
		// DELETE: Delete a user
		app.delete("/users/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await usersColl.deleteOne(query);
			res.status(204).send(result);
		});
		// GET: Fetch all or filtered tourGuides
		app.get("/tour-guides", async (req, res) => {
			const { guide_id, status, country } = req.query;
			const query = {};
			guide_id ? (query.guide_id = guide_id) : query;
			status ? (query.status = status) : query;
			country ? (query.country = country) : query;
			const result = await tourGuidesColl.find(query).toArray();
			res.send(result);
		});
		// POST: Create & insert a tourGuide
		app.post("/tour-guides", async (req, res) => {
			const newTourGuide = req.body;
			const result = await tourGuidesColl.insertOne(newTourGuide);
			res.status(201).send(result);
		});
		// GET: Fetch all or filtered tours
		app.get("/tours", async (req, res) => {
			const { random, sort } = req.query;
			if (random) {
				const result = await toursColl
					.aggregate([{ $sample: { size: parseInt(random) } }])
					.toArray();
				return res.send(result);
			}
			const query = {};
			const sortQuery = {};
			sort && sort !== "0" ? (sortQuery["tour.price"] = parseInt(sort)) : sortQuery;
			const result = await toursColl.find(query).sort(sortQuery).toArray();
			res.send(result);
		});
		// GET: Fetch a tour
		app.get("/tours/:tour_id", async (req, res) => {
			const tourId = req.params.tour_id;
			const query = { tour_id: tourId };
			const result = await toursColl.findOne(query);
			res.send(result);
		});
		// POST: Create & insert a tour
		app.post("/tours", async (req, res) => {
			const newTour = req.body;
			const result = await toursColl.insertOne(newTour);
			res.status(201).send(result);
		});
		// DELETE: Delete a tour
		app.delete("/tours/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await toursColl.deleteOne(query);
			res.status(204).send(result);
		});
		// GET: Fetch all or filtered bookings
		app.get("/bookings", async (req, res) => {
			const { tourist_email } = req.query;
			const query = {};
			tourist_email ? (query.tourist_email = tourist_email) : query;
			const result = await bookingsColl.find(query).toArray();
			res.send(result);
		});
		// POST: Create & insert a booking
		app.post("/bookings", async (req, res) => {
			const newBooking = req.body;
			const result = bookingsColl.insertOne(newBooking);
			res.status(201).send(result);
		});
		// GET: Fetch all or filtered stories
		app.get("/stories", async (req, res) => {
			const { story_id, poster, random } = req.query;
			if (random) {
				const result = await storiesColl
					.aggregate([{ $sample: { size: parseInt(random) } }])
					.toArray();
				return res.send(result);
			}
			const query = {};
			story_id ? (query.story_id = story_id) : query;
			poster ? (query.poster_email = poster) : query;
			const result = await storiesColl.find(query).toArray();
			res.send(result);
		});
		// POST: Create & insert a story
		app.post("/stories", async (req, res) => {
			const newStory = req.body;
			const result = storiesColl.insertOne(newStory);
			res.status(201).send(result);
		});
		// DELETE: Delete a story
		app.delete("/stories/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await storiesColl.deleteOne(query);
			res.status(204).send(result);
		});
		// Ping for successful connection confirmation (turn off in deployment)
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
