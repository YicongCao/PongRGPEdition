FROM node:alpine

WORKDIR /app

# prepare environment
COPY package*.json ./
RUN npm install
RUN npm install browserify -g 
RUN apk add --no-cache bash

# generate frontend code
COPY . .
RUN browserify ./src/gameclient.js -o ./static/compiled.js
RUN ["chmod", "+x", "./launchgame.sh"]

EXPOSE 3000 3001
ENTRYPOINT [ "./launchgame.sh" ]