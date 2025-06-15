#!/bin/bash

BROKER="localhost"
TOPIC="branko/sensor/temperature"
CLIENT_ID="temp-sensor"

while true; do
    # Generate a random float between 19.0 and 23.0
    temperature=$(awk -v min=19 -v max=23 'BEGIN{srand(); printf("%.2f", min+rand()*(max-min))}')

    echo "[TEMP SENSOR] Publishing temperature: $temperature °C"
    mosquitto_pub -h "$BROKER" -i "$CLIENT_ID" -t "$TOPIC" -m "$temperature"

    sleep 10
done
