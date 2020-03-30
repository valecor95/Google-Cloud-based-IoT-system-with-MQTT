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

//handlebars helpers
const {stripTags} = require('./helpers/hbs');
const {eq} = require('./helpers/hbs');

/********************************************************************************************************/
/*                                    WebSocket and MQTT connection                                     */
/********************************************************************************************************/
// Imports the Google Cloud client library
io.on('connection', function(socket){
  const subscriptionName = 'projects/awesome-sylph-271611/subscriptions/my-subscription1';

  // Creates a client; cache this for further use
  const pubSubClient = new PubSub();

  function listenForMessages() {
    // References an existing subscription
    const subscription = pubSubClient.subscription(subscriptionName);

    // Create an event handler to handle messages
    const messageHandler = message => {
      console.log(`Received message ${message.id}:`);
      console.log(`\tData: ${message.data}`);
      console.log(`\tAttributes: ${message.attributes}`);
      // Splitting the payload received
      var payload = `${message.data}`.split(";");

      // Insert the new value in the Database
      const newValue = {
        deviceId: payload[0].toString(),
        value: payload[1].toString(),
        date: payload[2].toString()
      };
      new Values(newValue).save();

      // TEMPERATURE websocket displays new value
      if(payload[0] == "device1" || payload[0] == "riot_device1")
        io.emit("temperature", payload[1]+";"+payload[2]);
      // HUMIDITY websocket displays new value
      if(payload[0] == "device2" || payload[0] == "riot_device2")
        io.emit("humidity", payload[1]+";"+payload[2]);
      // WIND DIRECTION websocket displays new value
      if(payload[0] == "device3" || payload[0] == "riot_device3")
        io.emit("wind", payload[1]+";"+payload[2]);
      // RAIN HEIGHT websocket displays new value
      if(payload[0] == "device4" || payload[0] == "riot_device4")
        io.emit("rain", payload[1]+";"+payload[2]);

      // "Ack" (acknowledge receipt of) the message
      message.ack();
    };

    // Listen for new messages until timeout is hit
    subscription.on('message', messageHandler);
  }
  listenForMessages();
});

/*********************************************************************************************************/
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

// GET route for index page
app.get('/', function (req, res) {
  // Query to retrieve the last hour values
  Values.find(
    { date: { $gt: parseInt(Date.now()/1000) - 3600 } }
  ).then(values =>{
    res.render('index', {values:values});
  })
});

// Starting Server
const port = process.env.PORT || 5000;
http.listen(port, ()=>{
  console.log(`Server started on port ${port}`);
} );
