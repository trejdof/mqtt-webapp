SENSOR_TOPIC = "branko/sensor/temperature"

BOILER_TOPIC = "branko/boiler/control"

ACK_TOPIC = "branko/boiler/ack"

STATE_REQUEST_TOPIC = "branko/boiler/state/request"
STATE_RESPONSE_TOPIC = "branko/boiler/state/response"
STATE_SYNC_ACK_TOPIC = "branko/boiler/state/sync_ack"

DEVICE_STATUS_TOPIC_PATTERN = "branko/devices/+/status"  # + is wildcard
RELAY_STATUS_TOPIC = "branko/devices/relay/status"
SENSOR_STATUS_TOPIC = "branko/devices/temp_sensor/status"