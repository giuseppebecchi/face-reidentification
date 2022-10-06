//const mode = 'webcam';
const mode = 'video';

import * as faceapi from './dist/face-api.esm.js';

// configuration options
const modelPath = './model/'; // path to model folder that will be loaded using http
const minScore = 0.2; // minimum score
const maxResults = 5; // maximum number of results to return

let optionsSSDMobileNet;
let faceMatcher;


let labeledFaceDescriptors;

//ptreshold face match
const faceMatcherTreshold = 0.7;

//percentualme minima di copertura del frame per poter acquisire l'immagine
const minFaceCoverToEnableRecognition = 0.15;

//valore massimo di angolo di pitch per poter filtrare solo facce inquadrate frontalmente
const faceFrontDetectionMaxAnglePitch = 0.2;

//valore minimo di angolo di pitch per poter filtrare solo facce inquadrate di lato
const faceSideDetectionMinAnglePitch = 0.8;

let subjectsSideImages = {}

const code = (Math.random() + 1).toString(36).substring(7);

       fetch("http://localhost:8000/api/subjects")
        .then(response => response.json())
        .then(data => {
          console.log('Success:', data);
        })



const subject = {
            'id': code,
            'first_name': code,
            'enabled': 1,
        }


        fetch("http://localhost:8000/api/subjects", {
          method: 'POST', // or 'PUT'
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subject),
        })
        .then(response => response.json())
        .then(data => {
          console.log('Success:', data);
        })



class Tracklet {

    subject = null;
    start = null;
    end = null;
    active = false;


    constructor(subject) {
        this.subject = subject;
        this.start = Date.now()
        this.active = true;
    }

    close(){
        this.end = Date.now();
        this.active = false;

        console.log(`Chiusa tracklet: ${this.subject} Start: ${this.start} End: ${this.end}`)
        //[TODO] save or log
    }


}

class Subject {

    code = null;
    side = false;

    constructor(code) {
        this.code = code;
    }

    setSide(){
        this.side = true;
    }


}



class DetectionManager {

    apiUrl = "http://localhost:8000/api"

    subjects = {}

    currentSubjets = []

    trackletsRecorded = []

    activeTracklets = {}

    constructor() {}




    detectSubject(subject) {

        this.currentSubjets.push(subject)

        if (!this.activeTracklets[subject]) this.activeTracklets[subject] = new Tracklet(subject)
    }

    /*getActiveTracklets(){
        return this.activeTracklets.filter(tracklet => tracklet.active);
    }*/


    closeCompletedTracklets(){ //controllo tutte le tracklet in corso e i subject attivi per chiudere le tracklet che non hanno più il soggetto in scena

        for (const subject in this.activeTracklets) {

            if(!this.currentSubjets.includes(subject)) {
                this.activeTracklets[subject].close();
                this.trackletsRecorded.push(this.activeTracklets[subject])

                            fetch(this.apiUrl+"/photos", {
              method: 'POST', // or 'PUT'
              headers: {
                'Content-Type': 'application/json',
              },
                 body: JSON.stringify(image),
                })



                //[TODO] save or other stuff
                delete this.activeTracklets[subject];
                //console.log("chiusa tracklet",)
            }

        }

        this.currentSubjets = []

    }

    createNewSubject(imgBase64){
        const code = this.getNewCode();

        this.subjects[code] = new Subject(code);

        const subject = {
            'id': code,
            'first_name': code,
            'enabled': 1,
        }

        console.log("subject to post",subject);


        const image = {
            'id': code+"_FRONT",
            'subject_id': code,
            'imgBase64': imgBase64
        }


        fetch(this.apiUrl+"/subjects", {
          method: 'POST', // or 'PUT'
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subject),
        })
        .then(response => response.json())
        .then(data => {
          console.log('Success:', data);
          console.log('Adding image:', data);


            fetch(this.apiUrl+"/photos", {
              method: 'POST', // or 'PUT'
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(image),
            })

        })
        .catch((error) => {
          console.error('Error:', error);
        });


        return code;

    }


    getNewCode(){

        return "S_"+(Object.keys(this.subjects).length+1)+"_"+(Math.random() + 1).toString(36).substring(7)
    }



}

const dm = new DetectionManager();


// helper function to pretty-print json object to string
function str(json) {
  let text = '<font color="lightblue">';
  text += json ? JSON.stringify(json).replace(/{|}|"|\[|\]/g, '').replace(/,/g, ', ') : '';
  text += '</font>';
  return text;
}

// helper function to print strings to html document as a log
function log(...txt) {
  // eslint-disable-next-line no-console
  console.log(...txt);
  const div = document.getElementById('log');
  if (div) div.innerHTML += `<br>${txt}`;
}

function capFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getRandomInt(min, max) {
  	return Math.floor(Math.random() * (max - min)) + min;
}

function generateName(){

	var name1 = ["Raffaello Mascetti","Rambaldo Melandri",
      "Giorgio Perozzi",
      "Guido Necchi",
      //"Donatella Sassaroli",
      //"Titti Ambrosio",
      //"Alice Mascetti",
      "Nicolò Righi",
      "Alfeo Sassaroli",
      "Verdirame Augusto",
      //"Carmen Necchi",
      //"Laura Perozzi",
      //"Bruna, amante di Perozzi"
    ];


	return name1[getRandomInt(0, name1.length + 1)];

}

// helper function to draw detected faces
function drawFaces(canvas, data, fps) {
  const ctx = canvas.getContext('2d');
  const video = document.getElementById('video');



  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // draw title
  ctx.font = '14px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText(`FPS: ${fps}`, 10, 25);
  for (const person of data) {
    // draw box around each face


    ctx.lineWidth = 3;
    ctx.strokeStyle = person.color;
    ctx.fillStyle = person.color;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.rect(person.detection.box.x, person.detection.box.y, person.detection.box.width, person.detection.box.height);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // const expression = person.expressions.sort((a, b) => Object.values(a)[0] - Object.values(b)[0]);
/*    const expression = Object.entries(person.expressions).sort((a, b) => b[1] - a[1]);
    ctx.fillStyle = 'black';
    ctx.fillText(`gender: ${Math.round(100 * person.genderProbability)}% ${person.gender}`, person.detection.box.x, person.detection.box.y - 59);
    ctx.fillText(`expression: ${Math.round(100 * expression[0][1])}% ${expression[0][0]}`, person.detection.box.x, person.detection.box.y - 41);
    ctx.fillText(`age: ${Math.round(person.age)} years`, person.detection.box.x, person.detection.box.y - 23);
    ctx.fillText(`roll:${person.angle.roll.toFixed(3)} pitch:${person.angle.pitch.toFixed(3)} yaw:${person.angle.yaw.toFixed(3)}`, person.detection.box.x, person.detection.box.y - 5);
    ctx.fillStyle = 'lightblue';
    ctx.fillText(`gender: ${Math.round(100 * person.genderProbability)}% ${person.gender}`, person.detection.box.x, person.detection.box.y - 60);
    ctx.fillText(`expression: ${Math.round(100 * expression[0][1])}% ${expression[0][0]}`, person.detection.box.x, person.detection.box.y - 42);
    ctx.fillText(`age: ${Math.round(person.age)} years`, person.detection.box.x, person.detection.box.y - 24);
    ctx.fillText(`roll:${person.angle.roll.toFixed(3)} pitch:${person.angle.pitch.toFixed(3)} yaw:${person.angle.yaw.toFixed(3)}`, person.detection.box.x, person.detection.box.y - 6);*/
    ctx.fillStyle = person.color;

    ctx.fillRect(person.detection.box.x, person.detection.box.y - 18, ctx.measureText(person.label).width +4, 18);

    ctx.fillStyle = 'white';
    ctx.fillText(person.label, person.detection.box.x+2, person.detection.box.y - 2);

    ctx.font = '12px Arial';

    ctx.fillStyle = 'white';
    ctx.fillText(`box_width: ${(person.detection.box.width/video.videoWidth).toFixed(2)}  pitch:${person.angle.pitch.toFixed(3)}`, person.detection.box.x+1, person.detection.box.y - 21);

    ctx.fillStyle = 'black';
    ctx.fillText(`box_width: ${(person.detection.box.width/video.videoWidth).toFixed(2)}  pitch:${person.angle.pitch.toFixed(3)}`, person.detection.box.x, person.detection.box.y - 22);
    // draw face points for each face
    /*ctx.globalAlpha = 0.8;
    ctx.fillStyle = 'lightblue';
    const pointSize = 2;
    for (let i = 0; i < person.landmarks.positions.length; i++) {
      ctx.beginPath();
      ctx.arc(person.landmarks.positions[i].x, person.landmarks.positions[i].y, pointSize, 0, 2 * Math.PI);
      // ctx.fillText(`${i}`, person.landmarks.positions[i].x + 4, person.landmarks.positions[i].y + 4);
      ctx.fill();
    }*/
  }
}

function createCanvas(width,height) {
    const canvas_bb = document.createElement('canvas');

    canvas_bb.width = width
    canvas_bb.height = height
    return canvas_bb;
}
async function detectVideo(video, canvas) {
  if (!video || video.paused) return false;
  const t0 = performance.now();

  faceapi
    .detectAllFaces(video, optionsSSDMobileNet)
    .withFaceLandmarks()
    //.withFaceExpressions()
    .withFaceDescriptors()
    //.withAgeAndGender()
    .then((result) => {
      const fps = 1000 / (performance.now() - t0);

      const resultsWithMatches = result.map(d => {
        d['bestMatch'] = faceMatcher.findBestMatch(d.descriptor)
        d['front'] = Math.abs(d.angle.pitch)<faceFrontDetectionMaxAnglePitch &&
            (d.detection.box.width/video.videoWidth) > minFaceCoverToEnableRecognition
        d['match'] = d['bestMatch'].label != 'unknown'
        d['color'] = d['match'] ? 'green' : 'grey'
        d['code'] = d['match'] ? d['bestMatch'].label: null
        d['label'] = d['bestMatch'].label+" "+(d['front']?'[FRONT] ':'')+d['bestMatch'].distance.toFixed(3)



        //se c'è il match lo registro nel detection manager
        if(d['match']) dm.detectSubject(d['code'])


        if( //nuova facci con vista centrale e buona risoluzione  -> aggiungo in DB
            d['bestMatch'].label == 'unknown' &&
            d['front']
        )
        {

          const canvas_bb = createCanvas(d.detection.box.width,d.detection.box.height);
          const newCode = dm.createNewSubject(canvas_bb.toDataURL());
          console.log("sconosciuto con vista frontale buona -> aggiunto al DB con: "+newCode)

          addNewFaceToFaceMatcher(newCode,d.descriptor)

          canvas_bb.getContext('2d').drawImage(video, d.detection.box.x, d.detection.box.y, d.detection.box.width, d.detection.box.height,0,0, d.detection.box.width, d.detection.box.height);





          //parte di visualizzazione da personalizzare frontend/nodejs

          const img = document.createElement('img');
          img.height = 80
          img.src = canvas_bb.toDataURL();

          var li = document.createElement("li");
           //li.appendChild(canvas_bb);
           li.appendChild(img);
           li.appendChild(document.createElement('br'));
           li.appendChild(document.createTextNode(newCode+" [FRONT]"));
           document.getElementById("faces").appendChild(li);

        }

        if( //faccia conosciuta ma con inquadratura di lato (prima volta
            d['match'] &&
            Math.abs(d.angle.pitch)>faceSideDetectionMinAnglePitch &&
            (d.detection.box.width/video.videoWidth) > minFaceCoverToEnableRecognition &&
                !dm.subjects[d['code']].side

        )
        {

          console.log(d['code']+" con vista buona di lato [prima volta] -> aggiungo al DB ")
          dm.subjects[d['code']].side = true;
          addNewFaceToFaceMatcher(d['bestMatch'].label,d.descriptor)
          const canvas_bb = createCanvas(d.detection.box.width,d.detection.box.height);
          canvas_bb.getContext('2d').drawImage(video, d.detection.box.x, d.detection.box.y, d.detection.box.width, d.detection.box.height,0,0, d.detection.box.width, d.detection.box.height);


          const img = document.createElement('img');
          img.height = 80
          img.src = canvas_bb.toDataURL();
          var li = document.createElement("li");
           li.appendChild(img);
           li.appendChild(document.createElement('br'));
           li.appendChild(document.createTextNode(d['bestMatch'].label+" [SIDE]"));
           document.getElementById("faces").appendChild(li);

                                                                                                                     }

        return d
      })



      drawFaces(canvas, resultsWithMatches, fps.toLocaleString());
      dm.closeCompletedTracklets();
      requestAnimationFrame(() => detectVideo(video, canvas));
      return true;
    })
    .catch((err) => {
      log(`Detect Error: ${str(err)}`,err);
      return false;
    });/**/


  return false;
}

// just initialize everything and call main function
async function setupCamera() {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  if (!video || !canvas) return null;



  let msg = '';

  if(mode == 'video') {
    video.src = './videos/speech.mp4'
  }


  if(mode == 'webcam') {
      log('Setting up camera');
      // setup webcam. note that navigator.mediaDevices requires that page is accessed via https
      if (!navigator.mediaDevices) {
        log('Camera Error: access not supported');
        return null;
      }
      let stream;
      const constraints = {
        audio: false,
        video: { facingMode: 'user',
          resizeMode: 'crop-and-scale',
          width: '700',
          height: '400',
        },
      };

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        if (err.name === 'PermissionDeniedError' || err.name === 'NotAllowedError') msg = 'camera permission denied';
        else if (err.name === 'SourceUnavailableError') msg = 'camera not available';
        log(`Camera Error: ${msg}: ${err.message || err}`);
        return null;
      }
      // @ts-ignore
      if (stream) video.srcObject = stream;
      else {
        log('Camera Error: stream empty');
        return null;
      }

      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      if (settings.deviceId) delete settings.deviceId;
      if (settings.groupId) delete settings.groupId;
      if (settings.aspectRatio) settings.aspectRatio = Math.trunc(100 * settings.aspectRatio) / 100;
      log(`Camera active: ${track.label}`); // ${str(constraints)}
      log(`Camera settings: ${str(settings)}`);


  }



  canvas.addEventListener('click', () => {
    // @ts-ignore
    if (video && video.readyState >= 2) {
      // @ts-ignore
      if (video.paused) {
        // @ts-ignore
        video.play();
        detectVideo(video, canvas);
      } else {
        // @ts-ignore
        video.pause();
      }
    }
    // @ts-ignore
    log(`Camera state: ${video.paused ? 'paused' : 'playing'}`);
  });
  return new Promise((resolve) => {
    video.onloadeddata = async () => {
      // @ts-ignore
      canvas.width = video.videoWidth;
      // @ts-ignore
      canvas.height = video.videoHeight;
      // @ts-ignore
      //video.play();
      //detectVideo(video, canvas);
      resolve(true);
    };
  });
}

async function initFaceMatcher() {
  labeledFaceDescriptors = await loadLabeledImages()
  faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, faceMatcherTreshold)
  console.log('Loaded Face DB')
}

async function addNewFaceToFaceMatcher(label ,descriptor) {
  labeledFaceDescriptors.push(new faceapi.LabeledFaceDescriptors(label,[descriptor]))
  faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, faceMatcherTreshold)
  console.log('Updated Face DB')
  return true;
}

function loadLabeledImages() {

  const labels = [
      'Black Widow',
      //'Captain America',
    //'Tony Stark',
    //'re','pippo','ferra',
    //'mara',
    /*'Captain Marvel', 'Hawkeye', 'Jim Rhodes', 'Thor', 'Tony Stark'*/
  ]
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 1; i++) {
        const img = await faceapi.fetchImage(`./labeled_images/${label}/${i}.jpg`)
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        descriptions.push(detections.descriptor)
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}

async function setupFaceAPI() {
  // load face-api models
  // log('Models loading');
  // await faceapi.nets.tinyFaceDetector.load(modelPath); // using ssdMobilenetv1
  await faceapi.nets.ssdMobilenetv1.load(modelPath);
  await faceapi.nets.ageGenderNet.load(modelPath);
  await faceapi.nets.faceLandmark68Net.load(modelPath);
  await faceapi.nets.faceRecognitionNet.load(modelPath);
  await faceapi.nets.faceExpressionNet.load(modelPath);
  optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({ minConfidence: minScore, maxResults });

  // check tf engine state
  log(`Models loaded: ${str(faceapi.tf.engine().state.numTensors)} tensors`);
}

async function main() {
  // initialize tfjs
  log('FaceAPI WebCam Test');

  // if you want to use wasm backend location for wasm binaries must be specified
  // await faceapi.tf.setWasmPaths('../node_modules/@tensorflow/tfjs-backend-wasm/dist/');
  // await faceapi.tf.setBackend('wasm');

  // default is webgl backend
  await faceapi.tf.setBackend('webgl');

  await faceapi.tf.enableProdMode();
  await faceapi.tf.ENV.set('DEBUG', false);
  await faceapi.tf.ready();

  // check version
  log(`Version: FaceAPI ${str(faceapi?.version.faceapi || '(not loaded)')} TensorFlow/JS ${str(faceapi?.tf?.version_core || '(not loaded)')} Backend: ${str(faceapi?.tf?.getBackend() || '(not loaded)')}`);
  // log(`Flags: ${JSON.stringify(faceapi?.tf?.ENV.flags || { tf: 'not loaded' })}`);

  await setupFaceAPI();
  await initFaceMatcher();
  await setupCamera();
}

// start processing as soon as page is loaded
window.onload = main;
