const express = require('express');
const path = require('path');                       //for path navigation
const bodyParser = require('body-parser');          //to access at req.value
const methodOverride = require('method-override');  //needs for edit and delete
const {PubSub} = require('@google-cloud/pubsub');   //google cloud pub/sub module

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

/********************************************************************************************************/
/*                                    WebSocket and Pub/Sub connection                                  */
/********************************************************************************************************/
// Imports the Google Cloud client library
io.on('connection', function(socket){
  // Creates a client; cache this for further use
  const pubSubClient = new PubSub();
  const subscriptionName = 'projects/awesome-sylph-271611/subscriptions/my-subscription1';

  function listenForMessages() {
    // References an existing subscription
    const subscription = pubSubClient.subscription(subscriptionName);
    const messageHandler = message => {
      console.log(`Received message ${message.id}:`);
      console.log(`\tData: ${message.data}`);
      console.log(`\tAttributes: ${message.attributes}`);
      var payload = `${message.data}`.split(";");

      // TEMPERATURE
      if(payload[0] == "device1")
        io.emit("temperature", payload[1]+";"+payload[2]);
      // HUMIDITY
      if(payload[0] == "device2")
        io.emit("humidity", payload[1]+";"+payload[2]);
      // HUMIDITY
      if(payload[0] == "device3")
        io.emit("wind", payload[1]+";"+payload[2]);
      // HUMIDITY
      if(payload[0] == "device4")
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

//body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));

//method override middleware
app.use(methodOverride('_method'));

app.get('/', function (req, res) {
  res.render('index');
});

const port = process.env.PORT || 5000;
http.listen(port, ()=>{
  console.log(`Server started on port ${port}`);
} );
