// Import required modules
let express = require('express'); // Express.js web framework
let path = require('path'); // Node.js path module for working with file paths
let fs = require('fs'); // Node.js file system module for reading files
let MongoClient = require('mongodb').MongoClient; // MongoDB client for Node.js
let bodyParser = require('body-parser'); // Middleware to parse incoming request bodies
let app = express(); // Create an instance of Express

// Middleware to parse URL-encoded and JSON request bodies
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

// Route for the root path, sends the "index.html" file
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Route for serving profile pictures
app.get('/profile-picture', function (req, res) {
  // Read the image file synchronously
  let img = fs.readFileSync(path.join(__dirname, "images/profile-1.jpg"));
  // Set the response header to indicate the image content type
  res.writeHead(200, {'Content-Type': 'image/jpg' });
  // Send the image as a binary response
  res.end(img, 'binary');
});

// MongoDB connection URL for local and Docker environments
let mongoUrlLocal = "mongodb://admin:password@localhost:27017";
let mongoUrlDocker = "mongodb://admin:password@mongodb";

// Options to connect to MongoDB to avoid DeprecationWarning
let mongoClientOptions = { useNewUrlParser: true, useUnifiedTopology: true } || {};
// Database name for the application
let databaseName = "my-db";

// Route to handle updating the user profile
app.post('/update-profile', function (req, res) {
  let userObj = req.body; // Extract the user data from the request body

  // Connect to MongoDB
  MongoClient.connect(mongoUrlLocal, mongoClientOptions, function (err, client) {
    if (err) throw err;

    let db = client.db(databaseName);
    userObj['userid'] = 1; // Add a userid property to the user object

    let myquery = { userid: 1 };
    let newvalues = { $set: userObj };

    // Update the user profile in the "users" collection, or insert if it doesn't exist (upsert: true)
    db.collection("users").updateOne(myquery, newvalues, { upsert: true }, function(err, res) {
      if (err) throw err;
      client.close(); // Close the MongoDB connection
    });

  });

  // Send the updated user object as a response
  res.send(userObj);
});

// Route to retrieve the user's profile
app.get('/get-profile', function (req, res) {
  let response = {}; // Initialize an empty object to store the response

  // Connect to MongoDB
  MongoClient.connect(mongoUrlLocal, mongoClientOptions, function (err, client) {
    if (err) throw err;

    let db = client.db(databaseName);

    let myquery = { userid: 1 }; // Query to find the user with userid 1

    // Find the user in the "users" collection and store the result in the response object
    db.collection("users").findOne(myquery, function (err, result) {
      if (err) throw err;
      response = result; // Store the result in the response object
      client.close(); // Close the MongoDB connection

      // Send the response object as the API response (empty object if no user found)
      res.send(response ? response : {});
    });
  });
});

// Start the Express server and listen on port 3000
app.listen(3000, function () {
  console.log("app listening on port 3000!");
});
