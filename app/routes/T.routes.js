const clientPool = require("pg").Pool;

const localDB = {
    host: 'localhost',
    database: 'emergencies',
    user: 'postgres',
    password: 'root'
};

const muensterDB = {
    host: 'giv-project4.uni-muenster.de',
    database: 'emergencies',
    user: 'postgres',
    password: 'postgres'
};

const client = new clientPool(localDB);

module.exports = (app) =>
{
    app.post("/contains", (req, res) => {
        let lat = req.body.lat;
        let lng = req.body.lng;
        let buffer = req.body.buffer;
        let date = req.body.date;
        
        client.query(`SELECT count(*) FROM crimes WHERE month = '${date}' and ST_DWithin(location::geography, ST_GeomFromText('POINT(${lng} ${lat})',4326)::geography, ${buffer});`, (err, result) => {
            if(err) throw err;
            else res.status(200).json(result.rows);
        });
    });

    app.post("/getCrimeTypes", (req, res) => {
        let lat = req.body.lat;
        let lng = req.body.lng;
        let buffer = req.body.buffer;
        let date = req.body.date;
        
        client.query(`SELECT crime_type, count(crime_type) FROM crimes WHERE month = '${date}' and ST_DWithin(location::geography, ST_GeomFromText('POINT(${lng} ${lat})',4326)::geography, ${buffer}) group by crime_type;`, (err, result) => {
            if(err) throw err;
            else res.status(200).json(result.rows);
        }); 
    })
}