const express = require('express')
const app = express()
const fetch = require("node-fetch");
const cors = require('cors');
const fs = require('fs');

app.use(cors());

OBJECT_IDS = {
  TEMPLEWOOD_GARDEN: 'ce9a206e-1106-4931-b833-32e779524429'
}

let freeparkingspots = {
  [OBJECT_IDS.TEMPLEWOOD_GARDEN]: []
};
let livefeed = {
  [OBJECT_IDS.TEMPLEWOOD_GARDEN]: './livefeed_templewood_garden.jpg'
};

app.get('/', async function (req, res) {
    const response = await fetch(
        "https://fordkerbhack.azure-api.net/features?viewport=51.5535663,-0.1887717,51.5589623,-0.1788357",
        {
            headers: {
                "Ocp-Apim-Subscription-Key": "42812550c6174a3c928d6c8319a76e32"
            }
        }
    );
    const kerbData = await response.json();

    kerbData.features = kerbData.features.map(feature => {
      if (freeparkingspots[feature.properties.location.objectId] && freeparkingspots[feature.properties.location.objectId].length) {
        return feature
      }
      return null;
    }).filter(feature => feature !== null);

    res.send(kerbData);
});

var container = document.getElementById("myVid"),
    video = document.createElement('video'),
    canCapture = true;
if (!video.canPlayType('video/wmv')) {
    /* If you don't have multiple sources, you can load up a Flash fallback here
       (like jPlayer), but you won't be able to capture frames */
    canCapture = false;
    return;
}
video.src = 'myvideo.wmv';
container.appendChild(video);
video.play(); //or put this in a button click handler if you want your own controls


var canvas = document.createElement('canvas');
canvas.width = 640;
canvas.height = 480;
var ctx = canvas.getContext('2d');
// if you want to preview the captured image,
// attach the canvas to the DOM somewhere you can see it.

//draw image to canvas. scale to target dimensions
ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

//convert to desired file format
var dataURI = canvas.toDataURL('image/jpeg'); // can also use 'image/png'



app.get('/livefeed_templewood_garden', async function (req, res) {
  const parkingSpotsFound = await updateLiveFeedData(OBJECT_IDS.TEMPLEWOOD_GARDEN)
  res.send(parkingSpotsFound);
});

const updateLiveFeedData = async (objectId) => {
  let imageFile = fs.readFileSync(livefeed[objectId]);
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

  const freeparking = imgData.responses[0].textAnnotations.filter(annotation => annotation.description.length <= 6 && annotation.description.match(/kerbie|kerble|Kerbie|Kerble|Kerb/));

  freeparkingspots[objectId] = freeparking;
  return `Found ${freeparking.length} free parking spots in ${objectId}`;
};

setInterval(async () => {
  console.log(await updateLiveFeedData(OBJECT_IDS.TEMPLEWOOD_GARDEN));
}, 2000);

app.listen(3000)
