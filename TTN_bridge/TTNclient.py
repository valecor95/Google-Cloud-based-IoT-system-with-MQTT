import paho.mqtt.client as mqtt
import json
import base64
import time
import datetime
import ttn, sys

# insert at 1, 0 is the script path (or '' in REPL)
sys.path.insert(1, '../MQTTSNbridge/')

import GoogleMQTTClient as google

class TTNclient:

    def __init__(self):
        self.app_id = None
        self.access_key = None

    def uplink_callback(self, msg, client):
        # Decode the payload received
        data_decoded = base64.b64decode(msg.payload_raw)
        spayload = data_decoded.decode('ascii')

        # Add correct date (The one in Lora is wrong)
        seconds = time.time()
        jpayload = json.loads(spayload)
        jpayload["date"] = int(seconds)
        payload = json.dumps(jpayload)
        print("Received uplink: ", jpayload)

        # Publish on Google IoT core MQTT broker
        Gclient.publish(mqtt_topic, payload, qos=0)
        Gclient.loop()
        return True

    def initTTNclient(self):
        self.app_id = 'assignment'
        self.access_key = 'ttn-account-v2.tJXg3gyYmMBzO4lELeFiL1uOVghBvaJb_c9ncAG-wPA'

        handler = ttn.HandlerClient(self.app_id, self.access_key)

        self.mqtt_client = handler.data()
        self.mqtt_client.set_uplink_callback(self.uplink_callback)
        self.mqtt_client.connect()

    def disconnect(self):
        self.mqtt_client.close()



ttn_client = TTNclient()
print("TTN bridge connection...")
ttn_client.initTTNclient()
print("Connected")

##########          GOOGLE CLIENT           ##########
project_id = 'awesome-sylph-271611'
cloud_region = 'us-central1'
registry_id = 'assignment1'
device_id = 'riotdevice'
private_key_file = './rsa_private.pem'
algorithm = 'RS256'
ca_certs = './roots.pem'
mqtt_bridge_hostname = 'mqtt.googleapis.com'
mqtt_bridge_port = 8883
message_type = 'event'


# Publish to the events or state topic based on the flag.
sub_topic = 'events' if message_type == 'event' else 'state'

mqtt_topic = '/devices/{}/{}'.format(device_id, sub_topic)

Gclient = google.get_client(project_id, cloud_region, registry_id,
                            device_id, private_key_file, algorithm,
                            ca_certs, mqtt_bridge_hostname, mqtt_bridge_port)

# Receive messages and intercept the interrupt signal
try:
    while True:
        pass
except KeyboardInterrupt:
    print("\nClosing the TTN bridge...")
    ttn_client.disconnect()
    print("Closed")
    sys.exit()