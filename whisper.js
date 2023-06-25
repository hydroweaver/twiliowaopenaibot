require('dotenv').config()
const fs = require('fs')
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

try {
    
    openai.createTranscription(fs.createReadStream('C://Users//hydro//Downloads//twiliowaopenaibot//MM0a8f51c857eb93716f13d6c1811842b5.ogg'),"whisper-1").then(val=>{
        console.log(val.data.text)
    })

    // openai.createTranscription(fs.createReadStream('C://Users//hydro//Downloads//twiliowaopenaibot//audio//sample-0.mp3'),"whisper-1").then(val=>{
    //     console.log(val.data.text)
    // })
} catch (error) {
    console.log(error)
}
