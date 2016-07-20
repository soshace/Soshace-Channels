# select node version
nvm use 5.8

# updating
git pull

# building project for server
meteor build ../ --architecture os.linux.x86_64
cd /home/ssi

#stop running app
forever stopall

# delete old app
rm -rf bundle

# unarchive & delete
tar -xf Soshace-Channels.tar.gz
rm Soshace-Channels.tar.gz

# npm install
cd bundle/programs/server
npm install

# delete packages because of errors and install again
cd npm/node_modules/meteor
rm -R npm-bcrypt

cd email
rm -rf node_modules/simplesmtp

cd /home/ssi/bundle/programs/server
npm install bcrypt
npm install imap
npm install mailparser
npm install simplesmtp@0.3.34
npm install nodemailer
npm rebuild

# copy utf7
#cp /home/ssi/Soshace-Channels/.utf7/utf7.js node_modules/utf7/

# copy settings
cp /home/ssi/settings.json /home/ssi/bundle/programs/server/

# set settings
export PORT=80
export MONGO_URL=mongodb://localhost:27017/meteor
export ROOT_URL=http://soshace.me
export METEOR_SETTINGS=$(cat settings.json)

# forever start
forever -a -l /home/ssi/ssi.log -a -e /home/ssi/ssi.err start /home/ssi/bundle/main.js
