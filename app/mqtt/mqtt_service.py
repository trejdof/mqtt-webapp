from app.mqtt import topics

_mqtt_client = None  # private module-level variable

def init(client_instance):
    global _mqtt_client
    _mqtt_client = client_instance

def publish_toggle_command():
    if not _mqtt_client:
        raise RuntimeError("MQTT client not initialized in mqtt_service.")
    _mqtt_client.publish(topics.BOILER_TOPIC, payload="TOGGLE")
    print("[MQTT SERVICE] Published TOGGLE to BOILER_TOPIC")
