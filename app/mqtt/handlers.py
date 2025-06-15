from app.repositories.state_repo import temp_heartbeat

def handle_temperature_ping(temp):
    temp_heartbeat(temp)

def handle_boiler_ack(payload):
    return 0