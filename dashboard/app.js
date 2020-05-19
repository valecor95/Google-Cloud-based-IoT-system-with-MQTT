const express = require('express');
const path = require('path');                       //for path navigation
const bodyParser = require('body-parser');          //to access at req.value
const methodOverride = require('method-override');  //needs for edit and delete
const {PubSub} = require('@google-cloud/pubsub');   //google cloud pub/sub module
const mongoose = require('mongoose');               //database
const exphbs = require('express-handlebars');       //front-end

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

//load values model
require('./models/Value');
const Values = mongoose.model('values');
require('./models/Accel_cloud');
const AccelCloud = mongoose.model('accel_cloud');
require('./models/Accel_edge');
const AccelEdge = mongoose.model('accel_edge');

//handlebars helpers
const {stripTags} = require('./helpers/hbs');
const {eq} = require('./helpers/hbs');

/********************************************************************************************************/
/*                                    WebSocket and MQTT connection                                     */
/********************************************************************************************************/

function predict(x, y, z){
  let magnitude = Math.hypot(x, y, z);
  if(magnitude > 9.05 && magnitude < 9.95) return 1;
  else return 0;
}

// Imports the Google Cloud client library
io.on('connection', function(socket){
  var values = Values.find(
    { date: { $gt: parseInt(Date.now()/1000) - 3600 } }
  ).sort({date:-1}).then(values => {
    io.emit("lastvalues", values);
  });

  const subscriptionName1 = 'projects/awesome-sylph-271611/subscriptions/my-subscription1';
  const subscriptionName2 = 'projects/awesome-sylph-271611/subscriptions/assignment4-subscription';
  // Creates a client; cache this for further use
  const pubSubClient = new PubSub();

  function listenForMessages() {
    // References an existing subscription
    const subscription1 = pubSubClient.subscription(subscriptionName1);
    const subscription2 = pubSubClient.subscription(subscriptionName2);
    // Create an event handler to handle messages

    /********************************************* ENVIRONMENTAL STATIONS *********************************************/
    const messageHandler1 = message => {
      console.log(`Received message ${message.id}:`);
      console.log('\tData:' + message.data);
      console.log(`\tAttributes: ${message.attributes}`);
      var payload = JSON.parse(message.data);

      const newValue = {
        deviceId: payload.deviceId,
        temperature: payload.temperature,
        humidity: payload.humidity,
        wind_direction: payload.wind_direction,
        wind_intensity: payload.wind_intensity,
        rain_height: payload.rain_height,
        date: payload.date
      };
      new Values(newValue).save();

      // TEMPERATURE
      io.emit("temperature", (payload.deviceId + ";" + payload.temperature + ";" + payload.date).toString());
      // HUMIDITY
      io.emit("humidity", (payload.deviceId + ";" + payload.humidity + ";" + payload.date).toString());
      // WIND DIRECTION
      io.emit("wind-dir", (payload.deviceId + ";" + payload.wind_direction + ";" + payload.date).toString());
      // WIND INTENSITY
      io.emit("wind-int", (payload.deviceId + ";" + payload.wind_intensity + ";" + payload.date).toString());
      // RAIN HEIGHT
      io.emit("rain", (payload.deviceId + ";" + payload.rain_height + ";" + payload.date).toString());
      // "Ack" (acknowledge receipt of) the message
      message.ack();
    };

    /********************************************* USER ACTIVITY RECOGNITION *********************************************/
    const messageHandler2 = message => {
      console.log(`Received message ${message.id}:`);
      console.log('\tData:' + message.data);
      console.log(`\tAttributes: ${message.attributes}`);
      var payload = JSON.parse(message.data);
      
      /********************************* CLOUD BASED ***************************************/
      if(payload.flag == 0){
        var status = predict(payload.x, payload.y, payload.z);

        const newValue = {
          deviceId: payload.user_id,
          x: payload.x,
          y: payload.y,
          z: payload.z,
          magnitude: (Math.hypot(payload.x, payload.y, payload.z)).toFixed(3),
          date: parseInt(Date.now()/1000),
          status: status
        };
        new AccelCloud(newValue).save();

        io.emit('status_cloud', JSON.stringify(newValue));
      }

      /*********************************** EDGE BASED ***************************************/
      else{
        const newValue = {
          deviceId: payload.user_id,
          date: parseInt(Date.now()/1000),
          status: payload.activity
        };
        new AccelEdge(newValue).save();

        io.emit('status_edge', JSON.stringify(newValue));
      }

      // "Ack" (acknowledge receipt of) the message
      message.ack();
    };

    // Listen for new messages until timeout is hit
    subscription2.on('message', messageHandler2);
    subscription1.on('message', messageHandler1);
  }
  listenForMessages();
});
/***********************************************************************************************************************/

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

// GET Home page
app.get('/', function (req, res) {
    res.render('index');
});

// GET route for environmental dashboard
app.get('/environmentalstations', function (req, res) {
  Values.find(
    { date: { $gt: parseInt(Date.now()/1000) - 3600 } }
  ).sort({date:-1}).then(values =>{
    res.render('envstat', {values:values});
  })
});

// GET route for user activity recognition dashboard
app.get('/useractivityrecognition', function (req, res) {

  // CLOUD BASED
  AccelCloud.find(
    { date: { $gt: parseInt(Date.now()/1000) - 3600 } }
  ).sort({date:-1}).then(values_cloud => {

    // EDGE BASED
    AccelEdge.find(
      { date: { $gt: parseInt(Date.now()/1000) - 3600 } }
    ).sort({date:-1}).then(values_edge => {
      res.render('uar', {values_cloud:values_cloud, values_edge:values_edge});
    });
  });
});

// Starting Server
const port = process.env.PORT || 5000;
http.listen(port, ()=>{
  console.log(`Server started on port ${port}`);
} );
