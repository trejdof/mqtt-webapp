#!/bin/bash

BROKER="localhost"
TOPIC_RECEIVE="branko/boiler/control"
TOPIC_SEND="branko/boiler/ack"
CLIENT_ID="boiler-mcu"

echo "[BOILER MCU] Subscribed to $TOPIC_RECEIVE..."

mosquitto_sub -h "$BROKER" -i "$CLIENT_ID" -t "$TOPIC_RECEIVE" | while read -r message; do
    if [[ "$message" == "TOGGLE" ]]; then
        sleep 0.2
        echo "[BOILER MCU] Sending ACK to $TOPIC_SEND"
        mosquitto_pub -h "$BROKER" -i "$CLIENT_ID-pub" -t "$TOPIC_SEND" -m "ACK"
    fi
done
