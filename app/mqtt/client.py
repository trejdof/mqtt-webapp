import paho.mqtt.client as mqtt
from app.mqtt import topics, handlers


MQTT_BROKER = "localhost"
MQTT_PORT = 1883
KEEPALIVE = 60

client = mqtt.Client()

def start_mqtt():
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(MQTT_BROKER, MQTT_PORT, KEEPALIVE)
    client.loop_start()


def on_connect(client, userdata, flags, rc):
    print("[MQTT] Connected with result code", rc)
    client.subscribe(topics.SENSOR_TOPIC)
    client.subscribe(topics.BOILER_TOPIC)


def on_message(client, userdata, msg):
    topic = msg.topic
    payload = msg.payload

    if topic == topics.SENSOR_TOPIC:
        handlers.handle_temperature_ping(payload)
    elif topic == topics.BOILER_TOPIC:
        handlers.handle_boiler_ack(payload)
    else:
        print(f"[MQTT] Unhandled topic: {topic}")