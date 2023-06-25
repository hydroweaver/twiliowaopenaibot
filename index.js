require('dotenv').config()
const express = require('express')
const app = express()
const fetch = require("node-fetch");
const axios = require('axios')
const fs = require('fs')
const {pipeline} = require('stream/promises');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
var ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(ffmpegPath)

//Open AI Config
const { Configuration, OpenAIApi } = require("openai");
const { Stream } = require('stream');
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

//Twilio Config
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

app.use(express.urlencoded({ extended: false }));
app.use(express.json())

app.get('/', (req, res)=>{
  res.send('Hello!')
})

app.get('/webhookverify', (req, res)=>{
  if(req.query['hub.verify_token']=='watest123')
    res.send(req.query['hub.challenge'])
})

app.post('/webhookverify', async (req, res)=>{
  if(req.body.MediaContentType0 == 'audio/ogg'){
    console.log(req.body)
    await fetch(req.body.MediaUrl0).then(async (file)=>{
      await axios({
        method: 'get',
        url: file.url,
        responseType: 'stream'
      }).then((response)=>{
          writeFileAndCallWhisper(response, req.body.MessageSid).then(async (val)=>{
            console.log(val)
            try {
              await openai.createTranscription(fs.createReadStream(`C://Users//hydro//Downloads//twiliowaopenaibot//${req.body.MessageSid}.mp3`),"whisper-1").then(async (whisper_response)=>{
                console.log(whisper_response)
              await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [{"role": "system", "content": "You are a helpful assistant."}, {role: "user", content: whisper_response.data.text}]
                // messages: [{"role": "user", "content": whisper_response.data.text.toString()}],
                // max_tokens:200,
                // n:1,
                // temperature:0.5,
              }).then((completionResponse)=>{
                // console.log(completionResponse.data.choices[0].message);
                client.messages
                .create({
                   from: req.body.To,
                   body: completionResponse.data.choices[0].message.content,
                   to: req.body.From
                 })
                .then(message => console.log(message.sid));
                })
              })
            } catch (error) {
              console.log(error)
            }
          })
        })
    })
  }
  else{
    // console.log(req.body)
    client.messages
      .create({
         from: req.body.To,
         body: 'Non Audio File, Skipping...',
         to: req.body.From
       })
      .then(message => console.log(message.sid));
  }
  res.sendStatus(200);
})

app.listen(3000, ()=>{
  console.log('Listening')
})


// function writeFileAndCallWhisper(response, messageID){
//   console.log(response);
//   return new Promise(async (resolve, reject)=>{
//     try {
//       response.data.pipe(fs.createWriteStream(`${messageID}.ogg`))
//       resolve('Done')
//     } catch (error) {
//       reject('Some Error')
//     }
//   })
// }


function writeFileAndCallWhisper(response, messageID){
    return new Promise(async (resolve, reject)=>{
      const fileStream = response.data.pipe(fs.createWriteStream(`${messageID}.ogg`));
      fileStream.on('finish', () => { 
        const outStream = fs.createWriteStream(`C://Users//hydro//Downloads//twiliowaopenaibot//${messageID}.mp3`);
        ffmpeg()
          .input(`${messageID}.ogg`)
          .audioQuality(96)
          .toFormat("mp3")
          .on("error", (error) => {
            console.log(`Encoding Error: ${error.message}`)
          }
          )
          .on("exit", () => console.log("Audio recorder exited"))
          .on("close", () => console.log("Audio recorder closed"))
          .on("end", () => {
            console.log("Audio Transcoding succeeded !")
            resolve('Done')
          })
          .pipe(outStream, { end: true });
      });
  }
)}