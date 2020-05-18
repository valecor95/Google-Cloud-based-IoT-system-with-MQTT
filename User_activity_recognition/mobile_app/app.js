const express = require('express');
const path = require('path');                       //for path navigation
const bodyParser = require('body-parser');          //to access at req.value
const methodOverride = require('method-override');  //needs for edit and delete
const exphbs = require('express-handlebars');       //front-end
const mongoose = require('mongoose');               //database
const fs = require('fs');
const jwt = require('jsonwebtoken');
const mqtt = require('mqtt');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// ----------------------------------------------------------------------------- SERVER DEFINITIONS
//load values model
require('./models/User');
const Users = mongoose.model('users');

//handlebars helpers
const {stripTags} = require('./helpers/hbs');
const {eq} = require('./helpers/hbs');

//handlebars middleware
app.engine('handlebars', exphbs({
  helpers: {stripTags: stripTags, eq:eq },
  defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

//body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));

//method override middleware
app.use(methodOverride('_method'));

// Map global promise - get rid of warning
mongoose.Promise = global.Promise;
//connect to mongoose
const uri = "mongodb+srv://assignment1:5JuACpmKysNwVGae@cluster0-1fa34.gcp.mongodb.net/IoT-assignment1";
mongoose.connect(uri, {
  useNewUrlParser: true
})
  .then(() => {
    console.log('MongoDb Connected..');
  })
  .catch(err => console.log(err));

//to use external resources
app.use(express.static(__dirname + '/public'));

// GET Home page
app.get('/', function (req, res) {
  res.render('index');
});

// Starting Server
const port = process.env.PORT || 5001;
http.listen(port, ()=>{
console.log(`Server started on port ${port}`);
});


io.on('connection', function(socket){

  /*
  // Check if the user is in the database
  socket.on('user', function(data){
    Users.find(
      { user_id: data.user }
    ).then(user =>{
      if(user == ''){
        newUser = {
          user_id: data,
          date: Date.now() / 1000,
          activities: []
        }
        new Users(newUser).save();
      }
      else{

      }
    })
    
  });
  */
  // ----------------------------------------------------------------------------- GOOGLE CLIENT

  // ----------------------------------------------------------------------------- JWT CONFIGURATION FUNCTION
  // Create a Cloud IoT Core JWT for the given project id, signed with the given
  // private key.
  const createJwt = (projectId, privateKeyFile, algorithm) => {

    // Create a JWT to authenticate this device. The device will be disconnected
    // after the token expires, and will have to reconnect with a new token. The
    // audience field should always be set to the GCP project id.
    const token = {
      iat: parseInt(Date.now() / 1000),
      exp: parseInt(Date.now() / 1000) + 20 * 60, // 20 minutes
      aud: projectId,
    };
    const privateKey = fs.readFileSync(privateKeyFile);
    return jwt.sign(token, privateKey, {algorithm: algorithm});
  };

  const publishAsync = (mqttTopic, client) => {
    socket.on('values', function(data){
      /*
      // Add the new prediction in the DB and check the date
      Users.find(
        { user_id: data.user_id }
      ).then(user =>{
        var newDate = Date.now() / 1000;
        // Update record, if necessary, for the last hour values received
        if(newDate - user.date >= 3600){
          Users.update(
            { user_id: data.user_id },
            { date: newDate,
              activities: []
            }
          );
        }
        data.activity == 1 ? user.activities.push("STILL") : user.activities.push("MOVING");
        user.save();
      })
      */
      console.log('PUBLISH: ' + JSON.stringify(data));
      client.publish(mqttTopic, JSON.stringify(data), {qos: 1});
    });
  };

  console.log("WEBSOCKET CONNECTED")
  // --------------------------------------------------------------------------- SUBSCRIBING
  // Arguments of the google cloud platform
  const projectId = `awesome-sylph-271611`;
  const deviceId = `accelerometers`;
  const registryId = `assignment4`;
  const region = `us-central1`;
  const algorithm = `RS256`;
  const privateKeyFile = `./rsa_private.pem`;
  const mqttBridgeHostname = `mqtt.googleapis.com`;
  const mqttBridgePort = 8883;
  const messageType = `events`;

  // The mqttClientId is a unique string that identifies this device. For Google
  // Cloud IoT Core, it must be in the format below.
  const mqttClientId = `projects/${projectId}/locations/${region}/registries/${registryId}/devices/${deviceId}`;

  // With Google Cloud IoT Core, the username field is ignored, however it must be
  // non-empty. The password field is used to transmit a JWT to authorize the
  // device. The "mqtts" protocol causes the library to connect using SSL, which
  // is required for Cloud IoT Core.
  const connectionArgs = {
    host: mqttBridgeHostname,
    port: mqttBridgePort,
    clientId: mqttClientId,
    username: 'unused',
    password: createJwt(projectId, privateKeyFile, algorithm),
    protocol: 'mqtts',
    secureProtocol: 'TLSv1_2_method',
  };

  // Create a client, and connect to the Google MQTT bridge.
  const client = mqtt.connect(connectionArgs);

  // Subscribe to the /devices/{device-id}/config topic to receive config updates.
  // Config updates are recommended to use QoS 1 (at least once delivery)
  client.subscribe(`/devices/${deviceId}/config`, {qos: 1});

  // Subscribe to the /devices/{device-id}/commands/# topic to receive all
  // commands or to the /devices/{device-id}/commands/<subfolder> to just receive
  // messages published to a specific commands folder; we recommend you use
  // QoS 0 (at most once delivery)
  client.subscribe(`/devices/${deviceId}/commands/#`, {qos: 0});

  // The MQTT topic that this device will publish data to. The MQTT topic name is
  // required to be in the format below. The topic name must end in 'state' to
  // publish state and 'events' to publish telemetry. Note that this is not the
  // same as the device registry's Cloud Pub/Sub topic.
  const mqttTopic = `/devices/${deviceId}/${messageType}`;

  // Handle the connection event
  client.on('connect', success => {
    console.log('connect');
    if (!success) {
      console.log('Client not connected...');
    } else {
      publishAsync(mqttTopic, client);
    }
  });

  // Handle the closing connection event
  client.on('close', () => {
    console.log('close');
  });

  // Handle the error event
  client.on('error', err => {
    console.log('error', err);
  });

  // Handle the message event 
  client.on('message', (topic, message) => {
    let messageStr = 'Message received: ';
    if (topic === `/devices/${deviceId}/config`) {
      messageStr = 'Config message received: ';
    } else if (topic.startsWith(`/devices/${deviceId}/commands`)) {
      messageStr = 'Command message received: ';
    }
    messageStr += Buffer.from(message, 'base64').toString('ascii');
    console.log(messageStr);
  });
});
