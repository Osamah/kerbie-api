const express = require('express')
const app = express()
const fetch = require("node-fetch");
const cors = require('cors');
const fs = require('fs');

app.use(cors());



app.get('/', async function (req, res) {

    const response = await fetch(
        "https://fordkerbhack.azure-api.net/features?viewport=51.5535663,-0.1887717,51.5589623,-0.1788357",
        {
            headers: {
                "Ocp-Apim-Subscription-Key": "42812550c6174a3c928d6c8319a76e32"
            }
        }
    );
    const curbLR = await response.json();

    res.send(curbLR);
});

app.get('/livefeed', async function (req, res) {
    let imageFile = fs.readFileSync('./livefeed.jpg');
    let encodedImg = Buffer.from(imageFile).toString('base64');

    const response = await fetch('https://vision.googleapis.com/v1/images:annotate?key=AIzaSyA8yFjZC5B556_Pkxjz2ltFDKTGxytns4M', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: `{
            "requests": [
              {
                "features": [
                  {
                    "maxResults": 50,
                    "type": "DOCUMENT_TEXT_DETECTION"
                  }
                ],
                "image": {
                  "content": "${encodedImg}"
                }
              }
            ]
          }`
    });

    const imgData = await response.json();
    res.send(imgData);
});

app.listen(3000)
