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
    const worksheetsCollection = client.db("Employetica").collection("worksheets");
    const paymentsCollection = client.db("Employetica").collection("payments");
    const contactsCollection = client.db("Employetica").collection("contacts");




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
      const existingUser = await usersCollection.findOne({ email: user.email });
      if (existingUser) {
        return res.status(200).send({ message: "User already exists" });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });


    ///** Employee Api **///

    // get api
    app.get('/worksheets', async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) return res.status(400).send({ message: 'Email required' });

        const result = await worksheetsCollection
          .find({ email })
          .sort({ createdAt: -1 })
          .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch worksheets' });
      }
    });



    // post api
    app.post('/worksheets', async (req, res) => {
      try {
        const worksheets = req.body;

        worksheets.createdAt = new Date();

        const result = await worksheetsCollection.insertOne(worksheets);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to insert worksheet' });
      }
    });


    //Task Update API
    app.put('/task/:id', async (req, res) => {
      const taskId = req.params.id;
      const updatedTask = req.body;
      console.log(updatedTask);

      try {
        const filter = { _id: new ObjectId(taskId) };
        const { _id, ...taskWithoutId } = updatedTask;
        const updateDoc = {
          $set: {
            ...taskWithoutId,
          },
        };

        const result = await worksheetsCollection.updateOne(filter, updateDoc);

        if (result.modifiedCount > 0) {
          res.send({ message: 'Task updated successfully' });
        } else {
          res.send({ message: 'No changes made to the task' });
        }
      } catch (error) {
        console.error('Update Task Error:', error);
        res.status(500).send({ message: 'Server error', error: error.message });
      }
    });

    


    // Delete task API
    app.delete('/task/:id', async (req, res) => {
      const taskId = req.params.id;

      try {
        const result = await worksheetsCollection.deleteOne({ _id: new ObjectId(taskId) });

        if (result.deletedCount === 1) {
          res.send({ message: 'Task deleted successfully' });
        } else {
          res.status(404).send({ message: 'Task not found' });
        }
      } catch (error) {
        console.error('Delete Task Error:', error);
        res.status(500).send({ message: 'Server error' });
      }
    });


    ///** HR Api **///

    // Get all employees
    app.get('/users/employee', async (req, res) => {
      try {
        const employees = await usersCollection.find({ role: "Employee" }).toArray();
        res.send(employees);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
        res.status(500).send({ message: "Server error" });
      }
    });


    app.get('/work-records', async (req, res) => {
      try {
        const records = await worksheetsCollection.find().toArray();
        res.send(records);
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch work records' });
      }
    });


    /// get user by slug (email)
    app.get('/users/:slug', async (req, res) => {
      const slug = req.params.slug;
      const user = await usersCollection.findOne({ email: slug });
      res.send(user);
    });

    // get payments by employee email
    app.get('/payments/employee', async (req, res) => {
      const email = req.query.email;
      const payments = await paymentsCollection.find({ employeeEmail: email }).toArray();
      res.send(payments);
    });



    app.post('/payments', async (req, res) => {
    const { employeeId, employeeName, employeeEmail, amount, month, year } = req.body;

    // Check if payment already requested for same employee + month + year
    const existingPayment = await paymentsCollection.findOne({ employeeId, month, year });
    if (existingPayment) {
      return res.status(400).send({ message: 'Payment request for this month already exists' });
    }

    const newPayment = {
      employeeId,
      employeeName,
      employeeEmail,
      amount,
      month,
      year,
      status: 'pending',
      timestamp: new Date(),
      approvedBy: null,
      paymentDate: null,
    };

    try {
      const result = await paymentsCollection.insertOne(newPayment);
      res.send({ success: true, message: 'Payment request created', result });
    } catch (error) {
      res.status(500).send({ message: 'Failed to create payment request' });
    }
  });





    app.patch("/users/verify/:id", async (req, res) => {
      const id = req.params.id;
      const { isVerified } = req.body;
      console.log(isVerified);

      try {
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: { isVerified: isVerified },
        };

        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (err) {
        console.error("Verification update error:", err);
        res.status(500).send({ error: "Internal server error" });
      }
    });




    ///** Admin Api **///

    // GET /users/verified
    app.get('/users-verified', async (req, res) => {
      try {
        const verifiedUsers = await usersCollection.find({ isVerified: true }).toArray();
        res.status(200).send(verifiedUsers);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
      }
    });


    app.get('/payments', async (req, res) => {
      try {
        const payments = await paymentsCollection.find().toArray();
        res.send(payments);
      } catch (error) {
        res.status(500).send({ error: 'Failed to fetch payments.' });
      }
    });





    // Make HR
    app.patch('/users/make-hr/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await usersCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { role: 'HR' } }
        );
        res.status(200).send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to update role' });
      }
    });

    // Fire Employee
    app.patch('/users/fire/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await usersCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { fired: true } }
        );
        res.status(200).send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to fire employee' });
      }
    });


    // Increase Salary (only if greater than current)
    app.patch('/users/salary/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const { newSalary } = req.body;

        const user = await usersCollection.findOne({ _id: new ObjectId(id) });
        if (!user) {
          return res.status(404).send({ error: 'User not found' });
        }

        if (newSalary <= user.salary) {
          return res.status(400).send({ error: 'Cannot decrease salary' });
        }

        const result = await usersCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { salary: newSalary } }
        );
        res.status(200).send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to update salary' });
      }
    });


    


    app.patch('/payments/:id/pay', async (req, res) => {
      const paymentId = req.params.id;
      const { approvedBy } = req.body;

      try {
        const payment = await paymentsCollection.findOne({ _id: new ObjectId(paymentId) });

        if (!payment) {
          return res.status(404).send({ message: 'Payment not found' });
        }

        if (payment.status === 'paid') {
          return res.status(400).send({ message: 'Payment already processed' });
        }

        const paymentDate = new Date();

        const result = await paymentsCollection.updateOne(
          { _id: new ObjectId(paymentId) },
          {
            $set: {
              status: 'paid',
              paymentDate,
              approvedBy,
            },
          }
        );

        res.send({ success: true, message: 'Payment marked as paid', result });
      } catch (error) {
        res.status(500).send({ message: 'Server error' });
      }
    });


    //** contact api **//

    //get all contact messages
    app.get('/contact-messages', async (req, res) => {
      try {
        const messages = await contactsCollection.find().sort({ createdAt: -1 }).toArray();
        res.send(messages);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to fetch messages' });
      }
    });


    // POST API to receive contact messages
    app.post('/contact-us', async (req, res) => {
      const { name, email, message } = req.body;

      if (!name || !email || !message) {
        return res.status(400).send({ error: true, message: 'All fields are required' });
      }

      const newMessage = {
        name,
        email,
        message,
        createdAt: new Date(),
      };

      try {
        const result = await contactsCollection.insertOne(newMessage);
        res.status(201).send({ success: true, message: 'Message received', data: result });
      } catch (error) {
        console.error('Contact message insertion error:', error);
        res.status(500).send({ error: true, message: 'Failed to save message' });
      }
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
