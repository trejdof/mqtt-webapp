SENSOR_TOPIC = "branko/sensor/temperature"

BOILER_TOPIC = "branko/boiler/control"

ACK_TOPIC = "branko/boiler/ack"

# Device connection status topics
DEVICE_STATUS_TOPIC_PATTERN = "branko/devices/+/status"  # + is wildcard for device_id
RELAY_STATUS_TOPIC = "branko/devices/relay/status"
SENSOR_STATUS_TOPIC = "branko/devices/temp_sensor/status"