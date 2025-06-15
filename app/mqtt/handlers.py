from app.repositories.state_repo import temp_heartbeat

def handle_temperature_ping(temp):
    toggle_boiler = temp_heartbeat(temp)

    if toggle_boiler:
        toggle_boiler()


def handle_boiler_ack(payload):
    return 0


# TODO  Publish MQTT message to the boiler TOPIC
#       Wait for ACK by the MCU on MQTT
#       Change boiler state in STATE
def toggle_boiler():
    return 0