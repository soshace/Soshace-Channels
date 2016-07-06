#!/bin/bash
#nave use 0.10.41
# meteor build tmp --architecture os.linux.x86_64
scp serverSettings.json tmp/ssi.tar.gz root@178.62.75.39:/home/ssi/
rm -rf tmp/
ssh root@178.62.75.39 'forever stopall && cd ../home/ssi && rm -rf bundle && tar -xf ssi.tar.gz && mv serverSettings.json bundle/programs/server/settings.json && rm ssi.tar.gz && cd bundle/programs/server && npm install && cd npm/node_modules/meteor && npm rebuild && rm -R npm-bcrypt && cd ../../.. && npm install bcrypt && npm install imap && npm install mailparser && npm install simplesmtp && export PORT=80 && export MONGO_URL=mongodb://localhost:27017/meteor && export ROOT_URL=http://178.62.75.39:80 && export METEOR_SETTINGS=$(cat settings.json) && forever start ../../main.js'
