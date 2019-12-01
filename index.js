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

app.get('/livefeed_templewood_garden', async function (req, res) {
  const parkingSpotsFound = await updateLiveFeedData(OBJECT_IDS.TEMPLEWOOD_GARDEN)
  res.send(parkingSpotsFound);
});

const updateLiveFeedData = async (objectId) => {
  let imageFile = fs.readFileSync(livefeed[objectId]);
  let encodedImg = Buffer.from(imageFile).toString('base64');

  try {
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
    // console.log(imgData);

    if (imgData.responses && imgData.responses.length && imgData.responses[0] !== {} && imgData.responses[0].textAnnotations) {
      const freeparking = imgData.responses[0].textAnnotations.filter(annotation => annotation.description.length <= 6 && annotation.description.match(/kerbie|kerble|Kerbie|Kerble|Kerb/));

      freeparkingspots[objectId] = freeparking;
      return `Found ${freeparking.length} free parking spots in ${objectId}`;
    }
  } catch (error) {
    console.log(error);
  }

  return `Found 0 free parking spots in ${objectId}`;

};

setInterval(async () => {
  console.log(await updateLiveFeedData(OBJECT_IDS.TEMPLEWOOD_GARDEN));
}, 1000);

app.listen(3000)
