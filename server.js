/**
 * REQUIREMENTS
 */

const app = require('express')();
const http = require('http');
const http_server = http.createServer(app);
const TelegramBot = require('node-telegram-bot-api')

const config = require('./config')

/**
 * VARIABLES
 */

var bot = new TelegramBot(config.tgbot_id, { polling: true });
var frequency = 1;
var stop = false;

var ids = []

/**
 *  COMANDI DA LANCIARE MANUALMENTE
 */

bot.onText(config.commands._HELP, (msg, match) => {
    help(msg.chat.id);
});

bot.onText(config.commands._STOP, (msg, match) => {
    ids.forEach(elem => {
        if(elem["id"] == msg.chat.id){
            elem["stop"] = true
        }
    });
    console.log(ids)
});

bot.onText(config.commands._RESTART, (msg, match) => {
    ids.forEach(elem => {
        if(elem["id"] == msg.chat.id){
            elem["stop"] = false
        }
    });
    console.log(ids)
});

bot.onText(config.commands._START, (msg, match) => {
    connection(msg.chat.id);

    _ids = []

    ids.forEach(elem => {
        _ids.push(elem["id"])
    });

    // List of connected ids
    if(ids.length == 0 || !(msg.chat.id in _ids)){
        ids.push({
            "id": msg.chat.id,
            "stop": stop
        })
    }

    console.log(ids)
});

bot.on("polling_error", (err) => console.log(err));

/**
 * FUNCTIONS
 */

function help(chat_id) {

    const str = "" +
        "******************************************\n" +
        " Azure IoT Manager v1.0.0 by MakarenaLabs \n" +
        "******************************************\n" +
        "You can manage your Azure IoT components\n" +
        "******************************************\n" +
        "Usage:\n" +
        "/start : you start the connection with Ultra96v2 board\n" +
        "/help : list of commands\n";

        send_message(chat_id, str)
}

function connection(chat_id){
    console.log("Connection start for chat id: ", chat_id);
}

function send_message(chat_id, str, relays=[]){

    var options = {}

    if(relays.length > 0){

        var buttons = []

        relays.forEach((button, i) => {

            var button_text = ""

            if(button){
                button_text = " ❌ "
            } else {
                button_text = " ✅ "
            }

            button_text += "R" + (i+1)

            var relays_str = ""
            relays.forEach((r, i) => {
                if(r){
                    relays_str += "1"
                } else {
                    relays_str += "0"
                }
            });

            buttons.push({
                "text": button_text,
                "callback_data": JSON.stringify({
                    'command': '/change_relays',
                    'relay': i,
                    'all_relays': relays_str
                })
            })
        });

        options = {
            parse_mode: 'html',
            reply_markup: {
                inline_keyboard: [buttons],
            },
        }
    }

    bot.sendMessage(chat_id, str, options).then(function () {
        console.log('message sent');
    }).catch(console.error);
}

function send_status(){

    return new Promise((resolve, reject)=>{
        http.get('http://' + config.flask_client.address + ':' + config.flask_client.port + '/devices', (resp) => {
            data = ""
            // A chunk of data has been received.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                console.log("GET -> " + data)
                var d = JSON.parse(data);
                frequency = d["frequency"]

                var elem = []

                d["accel1"].forEach(e => {
                    elem.push(e.toFixed(2))
                })
                d["accel1"] = elem
                elem = []
                d["Gaxis"].forEach(e => {
                    elem.push(e.toFixed(2))
                })
                d["Gaxis"] = elem
                elem = []
                d["accel2"].forEach(e => {
                    elem.push(e.toFixed(2))
                })
                d["accel2"] = elem
                elem = []
                d["magneto"].forEach(e => {
                    elem.push(e.toFixed(2))
                })
                d["magneto"] = elem
                elem = []

                var msg = "<b>SENSORS & RELAYS STATUS</b>\n"
                msg += "\n"
                msg += "Messages are sent every " + frequency + " seconds\n"
                msg += "\n"
                msg += "<i>SENSORS</i>\n"
                msg += "💧 Humidity:\t\t" + d["hum"].toFixed(2) + " %\n"
                msg += "🌡 Temp 1:\t\t" + d["temp1"].toFixed(2) + " °C\n"
                msg += "🕰 Pressure:\t\t" + d["pressure"].toFixed(2) + " hPa\n"
                msg += "🌡 Temp 2:\t\t" + d["temp2"].toFixed(2) + " °C\n"
                msg += "🏎 Accel 1:\t\t" + d["accel1"] + " rad/s²\n"
                msg += "🧭 G Axis:\t\t" + d["Gaxis"] + "\n"
                msg += "🏎 Accel 2:\t\t" + d["accel2"] + " rad/s²\n"
                msg += "🧲 Magnetometer:\t\t" + d["magneto"] + " T\n"
                msg += "\n"
                msg += "<i>RELAYS</i>\n"
                var c = 1
                relays = []
                for(let key in d){
                    if(key.startsWith('relay')){
                        msg += "Relay " + (c++) + ": "

                        if(d[key]){
                            msg += " ✅ "
                            relays.push(true)
                        } else {
                            msg += " ❌ "
                            relays.push(false)
                        }
                        msg += "\n"
                    }
                }

                resolve({
                    "msg": msg,
                    "relays": relays
                })

            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    })
}

/**
 * CALLBACK
 */

function change_relay(relay, relays){

    var postData = {}

    for(var i = 0; i < relays.length; ++i){
        postData["relay"+(i+1)] = relays.charAt(i) == "1"
    }

    postData["relay"+(relay+1)] = !postData["relay"+(relay+1)]

    const options = {
        hostname: config.flask_client.address,
        port: config.flask_client.port,
        path: '/devices',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
      
    const req = http.request(options, (res) => {
        console.log(options)
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
        });
        res.on('end', () => {
            console.log('No more data in response.');
        });
    });
      
    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });
      
    // Write data to request body
    req.write(JSON.stringify(postData));
    req.end();
}

bot.on('callback_query', function (msg) {

    var callback_data = JSON.parse(msg.data)

    switch (callback_data.command) {
        case '/change_relays':
            change_relay(callback_data.relay, callback_data.all_relays)
            break;
        case '/help':
            help(msg.from.id);
            break;
    }
});

var updates = async function(){
    var data_msg = await send_status()
    ids.forEach(chat_id => {
        if(!chat_id["stop"]){
            send_message(chat_id["id"], data_msg["msg"], data_msg["relays"]);
        }
    });
    setTimeout(updates, frequency * 1000);
}
setTimeout(updates, frequency * 1000);

/**
 * SERVER
 */

http_server.listen(config.port, () => {
    console.log(ids)
    console.log('listening on *:' + config.port);
});
