from app.repositories.state_repo import temp_heartbeat, toggle_boiler

def handle_temperature_ping(temp: float):
    should_toggle = temp_heartbeat(temp)

    if should_toggle:
        toggle_boiler()

    print("__________________________________________________________________________")


def handle_boiler_ack(payload):
    return 0


# TODO  Publish MQTT message to the boiler TOPIC
#       Wait for ACK by the MCU on MQTT
#       Change boiler state in STATE
def handle_toggle_boiler():
    return 0