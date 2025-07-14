const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();


const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB setup
const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
 
    const usersCollection = client.db("Employetica").collection("user");


    // get api to get user roll
    app.get('/users/:email/role', async (req, res) => {
      const email = req.params.email;

      try {
        const user = await usersCollection.findOne({ email });

        if (!user) {
          return res.status(404).send({ error: true, message: 'User not found' });
        }

        res.send({ role: user.role });
      } catch (error) {
        res.status(500).send({ error: true, message: 'Server Error' });
      }
    });


    // POST /users
    app.post("/users", async (req, res) => {
      const user = req.body;

      // Check if user already exists
      const existing = await usersCollection.findOne({ email: user.email });
      if (existing) {
          return res.status(200).send({ message: "User already exists." });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


// sample route
app.get('/', (req, res) => {
    res.send("Employetica server is running")
})

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
