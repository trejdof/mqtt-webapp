from app.models.interval import Interval
from app.models.configuration import Configuration
from app.models.time import Time
from app.repositories.config_repo import *
from app.repositories.state_repo import *
from app.constants import DAYS_OF_WEEK
from app.mqtt import client, mqtt_service
from time import sleep
import threading
import uvicorn


def start_mqtt_client():
    """Start MQTT client in the background"""
    # Inject the MQTT client into the service
    mqtt_service.init(client.client)

    client.start_mqtt()
    client.start_temperature_watchdog()

    state = load_state_threadsafe()
    print_state(state)


def main():
    # Start MQTT client in a separate thread
    mqtt_thread = threading.Thread(target=start_mqtt_client, daemon=True)
    mqtt_thread.start()

    # Start FastAPI web server (this will block)
    try:
        uvicorn.run("app.server:app", host="0.0.0.0", port=8000, reload=True)
    except KeyboardInterrupt:
        print("Shutting down...")
        client.watchdog_stop_event.set()

if __name__ == "__main__":
    main()