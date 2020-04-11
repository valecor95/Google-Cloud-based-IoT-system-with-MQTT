## About
To send the data at the MQTT Google broker we have to establish a connection. To do this I took a TTN client and an MQTT client and joining them I've created a device that receives data from The Thinghs Network and sends it to Google via MQTT. Inside this folder there is one python file:

`TTNclient.py`

Note that this file import the methods of the Class `GoogleMQTTClient.py` that is in `../MQTTSNbridge/`.

## Setup and run
1. Open the Bride folder:
```
cd TTN_bridge/
```
2. Install all the modules needed:
```
pip3 install
```
3. Start the bridge (This procedure has to be done before to launch the RIOT devices):
```
python3 TTNclient.py
```

If everything goes well you should have this view: