const https = require('https');
const http = require('http');
const fs = require('fs');
const acrcloud = require('./acrcloud.js');
const twit = require('twit')

let playing = "Malamente - ROSALIA";

const server = http.createServer((request, response) => {
  response.writeHead(200, {"Content-Type": "text/html"});
  response.end('<!DOCTYPE html>\
    <html lang="es">\
    <head>\
    <meta charset="UTF-8">\
    <title>Suena Radio3</title>\
    </head>\
    <body>\
    <h1>POC Webapp <a href="https://twitter.com/suenaradio3"> SuenaRadio3 </a></h1><br>\
    <h2>'+ playing +'</h2><br>\
    </body>\
    </html>');
});

const port = process.env.PORT || 1337;
server.listen(port);

console.log("Server running at http://localhost:%d", port);

const link = 'https://radio3.rtveradio.cires21.com/radio3_hc.mp3';
const duration = parseInt(process.env.duration);
const interval = parseInt(process.env.interval);

const acrcloudOptions = {
  host: 'eu-west-1.api.acrcloud.com',
  endpoint: '/v1/identify',
  signature_version: '1',
  data_type:'audio',
  secure: true,
  access_key: process.env.CUSTOMCONNSTR_acr_access_key,
  access_secret: process.env.CUSTOMCONNSTR_acr_access_secret
};
const twitter = new twit({
  consumer_key:         process.env.CUSTOMCONNSTR_twitter_consumer_key,
  consumer_secret:      process.env.CUSTOMCONNSTR_twitter_consumer_secret,
  access_token:         process.env.CUSTOMCONNSTR_twitter_access_token,
  access_token_secret:  process.env.CUSTOMCONNSTR_twitter_access_token_secret,
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
  strictSSL:            true,     // optional - requires SSL certificates to be valid.
})

const getStream = (link, filename, duration) => {
  const file = fs.createWriteStream('audio/' + filename + '.mp3');
  const request = https.get(link , res => {
    res.pipe(file);
    setTimeout(() => {
      request.abort();
      res.resume();
      res.unpipe();
      file.end();
      var bitmap = fs.readFileSync('audio/' + filename + '.mp3');
      acrcloud.identify(Buffer.from(bitmap), acrcloudOptions, function (err, httpResponse, body) {
        if (err) console.log(err);
        let track = JSON.parse(body);
        console.log(body);
        if (track['status']['msg'] === 'Success') {
          if (playing !== track['metadata']['music'][0]['title'] + ' - ' + track['metadata']['music'][0]['artists'][0]['name']) {
            playing = track['metadata']['music'][0]['title'] + ' - ' + track['metadata']['music'][0]['artists'][0]['name'];
            console.log( playing );
            let tweet = 'Ahora mismo suena en @radio3_rne : ' + playing;
            if ('youtube' in track['metadata']['music'][0]['external_metadata']) {
              tweet += ' https://youtu.be/' + track['metadata']['music'][0]['external_metadata']['youtube']['vid'];
            }
            twitter.post('statuses/update', { status: tweet }, function(err, data, response) {
              console.log(data)
            })
            fs.writeFile('data/' + filename + '.json', body, (err) => {
              if (err) console.log(err);
            });
          }
        }
      });
      fs.unlink('audio/' + filename + '.mp3', (err) => {
        if (err) throw err;
      });
    }, duration * 1000);
  });
};

setInterval(() => {
  const time = new Date();
  const filename = time.getUTCFullYear().toString() + ("0" + (time.getUTCMonth()+ 1) ).slice(-2) + ("0" + time.getUTCDate() ).slice(-2) + ("0" + time.getUTCHours() ).slice(-2) + ("0" + time.getUTCMinutes() ).slice(-2) + ("0" + time.getUTCSeconds() ).slice(-2);
  getStream(link, filename , duration);
}, interval * 1000);
// TODO: Implement Small GUI
// TODO: Implement MongoDB connection
