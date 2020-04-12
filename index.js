#!/home/pauron/.nvm/versions/node/v12.16.2/bin/node
const https = require('https');
const http = require('http');
const fs = require('fs');
const acrcloud = require('./acrcloud.js');

const server = http.createServer((request, response) => {
  response.writeHead(200, {"Content-Type": "text/html"});
  response.end('Habemus Webapp <a href="https://twitter.com/suenaradio3"> SuenaRadio3 </a>');
});

const port = process.env.PORT || 1337;
server.listen(port);

console.log("Server running at http://localhost:%d", port);

const link = 'https://radio3.rtveradio.cires21.com/radio3_hc.mp3';
const duration = 15;
const interval = 120;
const acrcloudOptions = {
  host: 'eu-west-1.api.acrcloud.com',
  endpoint: '/v1/identify',
  signature_version: '1',
  data_type:'audio',
  secure: true,
  access_key: 'cb9c1dccad129302acefe08270477dda',
  access_secret: 'Ewh37dNhGsJRP2nYnNaFprmD4pMnBHP2y1DalNyc'
};

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
        fs.writeFile('data/' + filename + '.json', body, (err) => {
          if (err) console.log(err);
        });
      });
      console.log(filename);
    }, duration * 1000);
  });
};


setInterval(() => {
  const time = new Date();
  const filename = time.getFullYear().toString() + time.getMonth().toString() + time.getDate().toString() + time.getHours().toString() + time.getMinutes().toString() + time.getSeconds().toString();
  getStream(link,  filename , duration);
}, interval * 1000);