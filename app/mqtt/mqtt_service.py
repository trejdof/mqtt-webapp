from app.mqtt import topics

_mqtt_client = None  # private module-level variable

def init(client_instance):
    global _mqtt_client
    _mqtt_client = client_instance

def publish_boiler_command(command: str):
    """
    Publish ON or OFF command to boiler.
    Args:
        command: "ON" or "OFF"
    """
    if not _mqtt_client:
        raise RuntimeError("MQTT client not initialized in mqtt_service.")
    if command not in ["ON", "OFF"]:
        raise ValueError(f"Invalid command: {command}. Must be 'ON' or 'OFF'")
    _mqtt_client.publish(topics.BOILER_TOPIC, payload=command)
    print(f"[MQTT SERVICE] Published {command} to BOILER_TOPIC")


def publish_message(topic: str, payload: str):
    if not _mqtt_client:
        raise RuntimeError("MQTT client not initialized in mqtt_service.")
    _mqtt_client.publish(topic, payload)
    print(f"[MQTT SERVICE] Published {payload} to {topic} topic") 