const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);


const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


const serviceAccount = require("./firebase-admin-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



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


    // coustom middlewares

    const verifyFBToken = async(req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).send({ message: 'unauthorized access' });
      }

      try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.decoded = decoded;

        const user = await usersCollection.findOne({ email: decoded.email });
        if (user?.fired === true) {
          return res.status(403).send({ message: 'You have been fired. Access denied.' });
        }

        next();
      } catch (error) {
        return res.status(403).send({ message: 'forbidden access' });
      }
    };



    // Middleware to verify Employee role
    const verifyEmployee = async (req, res, next) => {
      const email = req.decoded.email;
      const user = await usersCollection.findOne({ email });
      if (!user || user.role !== "Employee") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };


    // Middleware to verify HR role
    const verifyHR = async (req, res, next) => {
      const email = req.decoded.email;
      const user = await usersCollection.findOne({ email });
      if (!user || user.role !== "HR") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // Middleware to verify Admin role
    const verifyAdmin = async(req, res, next) =>{
      const email = req.decoded.email;
      const query = { email }
      const user = await usersCollection.findOne(query);
      if(!user || user.role !== 'Admin'){
        return res.status(403).send({ message: 'forbidden access'})
      }
      next();
    }


    app.get('/is-fired-user/:email', async (req, res) => {
      const paramEmail = req.params?.email?.toLowerCase();
      console.log('params-email', paramEmail);

      const user = await usersCollection.findOne({ email: paramEmail });

      res.send({ fired: user?.fired || false });
    });




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
    app.get('/worksheets', verifyFBToken, verifyEmployee, async (req, res) => {
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


    app.get('/payment-history', verifyFBToken, verifyEmployee, async (req, res) => {
      const { email, page = 1, limit = 5 } = req.query;
      const skip = (page - 1) * limit;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      try {
        const query = { employeeEmail: email, status: "paid" };

        const payments = await paymentsCollection
          .find(query)
          .sort({ paymentDate: -1 })
          .skip(Number(skip))
          .limit(Number(limit))
          .toArray();

        const totalCount = await paymentsCollection.countDocuments(query);

        res.json({ payments, totalCount });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // employee overview api
    app.get('/overview/employee', verifyFBToken, verifyEmployee, async (req, res) => {
      const email = req.decoded.email;

      try {
        const user = await usersCollection.findOne({ email });
        const tasks = await worksheetsCollection.find({ email }).toArray();
        const payments = await paymentsCollection.find({ employeeEmail: email, status: 'paid' }).toArray();

        res.send({
          name: user.name,
          role: user.role,
          totalTasks: tasks.length,
          salary: user.salary || 0,
          paidPayments: payments.length,
          lastPaymentDate: payments[0]?.paymentDate || null,
          isVerified: user.isVerified || false
        });
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch employee overview', error: error.message });
      }
    });





    // post api
    app.post('/worksheets', verifyFBToken, verifyEmployee, async (req, res) => {
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
    app.put('/task/:id', verifyFBToken, verifyEmployee, async (req, res) => {
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
    app.delete('/task/:id', verifyFBToken, verifyEmployee, async (req, res) => {
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
    app.get('/users/employee', verifyFBToken, verifyHR, async (req, res) => {
      try {
        const employees = await usersCollection.find({ role: "Employee" }).toArray();
        res.send(employees);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
        res.status(500).send({ message: "Server error" });
      }
    });


    app.get('/work-records', verifyFBToken, verifyHR, async (req, res) => {
      try {
        const records = await worksheetsCollection.find().toArray();
        res.send(records);
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch work records' });
      }
    });


    /// get user by slug (email)
    app.get('/users/:slug', verifyFBToken, verifyHR, async (req, res) => {
      const slug = req.params.slug;
      const user = await usersCollection.findOne({ email: slug });
      res.send(user);
    });

    // get payments by employee email
    app.get('/payments/employee', verifyFBToken, verifyHR, async (req, res) => {
      const email = req.query.email;
      const payments = await paymentsCollection.find({ employeeEmail: email }).toArray();
      res.send(payments);
    });


    // hr overview api
    app.get('/overview/hr', verifyFBToken, verifyHR, async (req, res) => {
      try {
        const totalEmployees = await usersCollection.countDocuments({ role: 'Employee' });
        const totalVerified = await usersCollection.countDocuments({ role: 'Employee', isVerified: true });
        const leavesToday = 0; // You can add leave data if implemented
        const totalPendingPayments = await paymentsCollection.countDocuments({ status: 'pending' });

        res.send({
          totalEmployees,
          verifiedEmployees: totalVerified,
          pendingPayments: totalPendingPayments,
          message: 'HR overview data'
        });
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch HR overview', error: error.message });
      }
    });



    app.post('/payments', verifyFBToken, verifyHR, async (req, res) => {
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





    app.patch("/users/verify/:id", verifyFBToken, verifyHR, async (req, res) => {
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
    app.get('/users-verified', verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const verifiedUsers = await usersCollection.find({ isVerified: true }).toArray();
        res.status(200).send(verifiedUsers);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
      }
    });


    app.get('/payments', verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const payments = await paymentsCollection.find().toArray();
        res.send(payments);
      } catch (error) {
        res.status(500).send({ error: 'Failed to fetch payments.' });
      }
    });


    app.get('/overview/admin', verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const totalUsers = await usersCollection.countDocuments();
        const totalEmployees = await usersCollection.countDocuments({ role: 'Employee' });
        const totalHRs = await usersCollection.countDocuments({ role: 'HR' });
        const totalPayments = await paymentsCollection.countDocuments();
        const totalSalary = await usersCollection.aggregate([
          { $match: { role: 'Employee' } },
          { $group: { _id: null, total: { $sum: "$salary" } } }
        ]).toArray();

        res.send({
          totalUsers,
          totalEmployees,
          totalHRs,
          totalPayments,
          totalSalaryBudget: totalSalary[0]?.total || 0,
        });
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch admin overview', error: error.message });
      }
    });




    // Make HR
    app.patch('/users/make-hr/:id', verifyFBToken, verifyAdmin, async (req, res) => {
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
    app.patch('/users/fire/:id', verifyFBToken, verifyAdmin, async (req, res) => {
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
    app.patch('/users/salary/:id', verifyFBToken, verifyAdmin, async (req, res) => {
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



    //** contact api **//

    //get all contact messages
    app.get('/contact-messages', verifyFBToken, verifyAdmin, async (req, res) => {
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



    // ** stripe api **//

    app.get('/payments/:id', verifyFBToken, verifyAdmin, async (req, res) => {
      const { id } = req.params;

      try {
        const payment = await paymentsCollection.findOne({ _id: new ObjectId(id) });

        if (!payment) {
          return res.status(404).send({ success: false, message: 'Payment not found' });
        }

        res.send(payment);
      } catch (error) {
        res.status(500).send({ success: false, message: 'Failed to fetch payment', error: error.message });
      }
    });


    app.post('/create-payment-intent', verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: req.body.amount,
          currency: 'usd',
        });
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });


    app.patch('/payments/:id', verifyFBToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const {
        transactionId,
        paymentDate,
        status,
        approvedBy
      } = req.body;

      try {
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            transactionId,
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            status: status || 'paid',
            approvedBy: approvedBy || 'Auto Stripe',
          },
        };

        const result = await paymentsCollection.updateOne(filter, updateDoc);
        res.send({ success: true, result });
      } catch (error) {
        res.status(500).send({ success: false, message: 'Failed to update payment', error: error.message });
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
