const express = require('express')
const app = express()
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const axios = require('axios');
const port = process.env.PORT || 4000

app.use(cors())
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hesma7h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


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
        // await client.connect();

        const db = client.db('liver_disease'); // Database name
        const predictionsCollection = db.collection('predictions'); // Collection name

        // Handle prediction request
        app.post('/predict', async (req, res) => {
            const input = req.body;

            try {
                // Send input to Flask app
                const response = await axios.post('http://127.0.0.1:5000/predict', {
                    features: input.features
                });

                const predictionResult = response.data;
                console.log("Prediction result:", predictionResult);

                // Save prediction to MongoDB
                const result = await predictionsCollection.insertOne({
                    input: input.features,
                    prediction: predictionResult.prediction,
                    probability: predictionResult.probability,
                    timestamp: new Date()
                });

                res.json({
                    success: true,
                    prediction: predictionResult.prediction,
                    probability: predictionResult.probability,
                    id: result.insertedId
                });
            } catch (error) {
                console.error('Error connecting to Flask API:', error.message);
                res.status(500).json({ error: 'Prediction service unavailable.' });
            }
        });

        // Fetch all predictions
        app.get('/predictions', async (req, res) => {
            try {
                const predictions = await predictionsCollection.find({}).toArray();
                res.json(predictions);
            } catch (error) {
                console.error('Error fetching predictions:', error.message);
                res.status(500).json({ error: 'Could not fetch predictions.' });
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



app.get('/', (req, res) => {
    res.send('E health server')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})







