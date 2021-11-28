'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3();

Date.prototype.addHours = function(h) {
  this.setTime(this.getTime() + (h*60*60*1000));
  return this;
}
Date.prototype.toMySQLString = function(){
  let str = this.toISOString();
  str = str.replace('T', ' ');
  str = str.replace(/\.\d{3}Z/, '');
  return str;
}


module.exports.handle = async event => {
  try {
    console.log('function started..........');
    const { estoque, service, user, project } = JSON.parse(event.body);
    console.log(estoque);
    const { bucket: Bucket } = process.env;
    const totalKey = `storage/${project}/__TOTAL_STORAGE.txt`;
    const ContentType = 'text/plain';
    
    let file;
    try {
      file = await S3.getObject({
        Bucket,
        Key: totalKey,
      }).promise();
    } catch (err) {
      console.log(err);
      await S3.putObject({
        Body: '',
        Bucket,
        ContentType,
        Key: totalKey,
      }).promise();
    }
    if (!file) file = { Body: '' };

    if (service === 'clearStorage') {
      const Body = '';
      await S3.putObject({
        Body,
        Bucket,
        ContentType,
        Key: totalKey,
      }).promise();
      return {
        statusCode: 200,
        body: ''
      };
    }

    const now = new Date().addHours(-3).toMySQLString();
    const newFileKey = `storage/${project}/${user}: ${now}.txt`;

    await S3.putObject({
      Body: estoque,
      Bucket,
      ContentType,
      Key: newFileKey,
    }).promise();

    const Body = `${file.Body.toString('utf-8')}${estoque}`;
    await S3.putObject({
      Body,
      Bucket,
      ContentType,
      Key: totalKey,
    }).promise();

    console.log('function returning..........');
    return {
      statusCode: 200,
      body: ''
    };
  } catch (error) {
    console.log('in catch!!!');
    console.log(error);
  }
};
