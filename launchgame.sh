#!/bin/bash
# browserify ./src/gameclient.js -o ./static/compiled.js
node ./webserver.js &
node ./src/gameserver.js
