require('dotenv').config({path: '.env'})

var config = {};

config.flask_client = {};
config.channel = {};
config.commands = {};

config.tgbot_id = process.env.TGBOT_ID || '';
config.port = 3456;

config.flask_client.address = process.env.FLASK_CLIENT_ADDRESS;
config.flask_client.port = 5000;

config.channel.login = 'start_login';
config.channel.change_state = 'change_state';
config.channel.rec_status = 'rec_status';

config.commands._HELP = /\/help/
config.commands._START = /\/start/
config.commands._RELAYS_STATUS = /\/relays/
config.commands._RESTART = /\/restart/
config.commands._STOP = /\/stop/

module.exports = config;