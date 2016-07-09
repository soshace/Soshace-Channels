#!/bin/bash
#nave use 0.10.41
# meteor build tmp --architecture os.linux.x86_64
scp serverSettings.json tmp/ssi.tar.gz .utf7/utf7.js root@178.62.75.39:/home/ssi/
rm -rf tmp/
ssh root@178.62.75.39 'forever stopall && cd ../home/ssi && rm -rf bundle && tar -xf ssi.tar.gz && mv serverSettings.json bundle/programs/server/settings.json && rm ssi.tar.gz && cd bundle/programs/server && npm install && cd npm/node_modules/meteor && rm -R npm-bcrypt && cd email && rm -rf node_modules/simplesmtp && cd ../../../.. && npm install bcrypt && npm install imap && npm install mailparser && npm install simplesmtp@0.3.34 && npm install nodemailer && npm rebuild && mv ../../../utf7.js node_modules/utf7/utf7.js && export PORT=80 && export MONGO_URL=mongodb://localhost:27017/meteor && export ROOT_URL=http://soshace.me && export METEOR_SETTINGS=$(cat settings.json) && cd ../.. && forever -a -l /home/ssi/ssi.log -a -e /home/ssi/ssi.err start main.js'
