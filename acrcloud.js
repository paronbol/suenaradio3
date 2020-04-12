const url = require('url');
const fs = require('fs');
const crypto = require('crypto');
const request = require('request');

function buildStringToSign(method, uri, accessKey, dataType, signatureVersion, timestamp) {
  return [method, uri, accessKey, dataType, signatureVersion, timestamp].join('\n');
}

function sign(signString, accessSecret) {
  return crypto.createHmac('sha1', accessSecret)
    .update(Buffer.from(signString, 'utf-8'))
    .digest().toString('base64');
}

function identify(data, options, cb) {

  var current_data = new Date();
  var timestamp = current_data.getTime()/1000;

  var stringToSign = buildStringToSign('POST',
    options.endpoint,
    options.access_key,
    options.data_type,
    options.signature_version,
    timestamp);

  var signature = sign(stringToSign, options.access_secret);

  var formData = {
    sample: data,
    access_key:options.access_key,
    data_type:options.data_type,
    signature_version:options.signature_version,
    signature:signature,
    sample_bytes:data.length,
    timestamp:timestamp,
  }

  request.post({
    url: "http://"+options.host + options.endpoint,
    method: 'POST',
    formData: formData
  }, cb);

}

module.exports.identify = identify;
