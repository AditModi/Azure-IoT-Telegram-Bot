#!/bin/bash

echo -en "
*** First configuration - Azure IoT Telegram Bot ***

Here you can set the Telegram Bot Token once you have created it with BotFather.

"

while [ -z $bot_id ]
do
    echo -en "Telegram Bot Token: "
    read bot_id
    if [ -z $bot_id ];then
        echo "[ERR]: Telegram Bot Token cannot be empty!"
    fi
done

echo "TGBOT_ID=${bot_id}" > .env

echo -en "
Ultra96v2 address for socket.io service (empty for 'localhost'): "

read address

if [ -z $address ];then
    address="localhost"
fi

echo "FLASK_CLIENT_ADDRESS=${address}" >> .env

echo "
Done."
