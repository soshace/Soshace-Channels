#!/bin/bash
#nave use 0.10.41
cd /home/ssi/dev/prod/Soshace-Channels;
git pull origin master
meteor npm install
meteor build ../../../package/ --architecture os.linux.x86_64
cp /home/ssi/package/ssi.tar.gz /home/ssi/prod/ssi.tar.gz
cd /home/ssi/prod/; 
tar -zxf ssi.tar.gz; 
npm rebuild
cd /home/ssi/prod/bundle/programs/server; 
npm install
chownmeteor -R www-data:www-data /home/ssi/prod/bundle/programs/server/npm
forever start ~/bundle/main.js