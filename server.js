const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.use(cors({origin: '*'}));

// Serve only the static files form the giis directory
app.use(express.static(__dirname + '/dist/dashboard'));


app.get("/",(req, res) => {
    res.sendFile(path.join(__dirname+'/dist/dashboard/index.html'));
});

require("./app/routes/T.routes.js")(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
