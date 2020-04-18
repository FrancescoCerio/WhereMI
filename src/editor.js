$(document).ready(function () {
  creaVideo();
});

var exportBlobs;
var arrayClips = []; //Array di clip registrate

function creaVideo() {

    // setto i local storage
    var dammiLingua = localStorage.getItem("lingua");
    document.getElementById("formLanguage").value = dammiLingua;
    var dammiCat = localStorage.getItem("categoria");
    document.getElementById("formCategory").value = dammiCat;
    var dammiPub = localStorage.getItem("pubblico");
    document.getElementById("formPublic").value = dammiPub;

    "use strict";
    try {
		    signinCallback(gapi.client.getToken());
		} catch (e) {
		    console.log("errore nel caricare il token");
	  }

    /* Variabili globali MediaRecorder */

    const mediaSource = new MediaSource();
    mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
    var mediaRecorder;
    let recordedBlobs;
    let sourceBuffer;
    var localstream;

    const startButton = document.querySelector('button#start');
    const recordedVideo = document.querySelector('video#recorded');
    const recordButton = document.querySelector('button#record');
    const deleteButton = document.querySelector('button#delete');
    const gumVideo = document.querySelector('video#gum');
    const eliminaModifiche = document.querySelector('button#eliminaModifiche');
    const salvaModifiche = document.querySelector('button#salvaModifiche');
    const anteprima = document.querySelector('video#anteprima');
    const anteprimaVideo = document.querySelector('div#anteprimaVideo');

    function disableButtons(){
      $('#btnNearMe').prop("onclick", null);
      $('#btnCategory').prop("onclick", null);
      $('#btnMap').prop("onclick", null);
      $('#btnProfilo').prop("onclick", null);
      $('#btnSearch').prop("onclick", null);
    }

    function enableButtons(){
      $('#btnNearMe').attr('onClick', 'viewNearMe();');
      $('#btnCategory').attr('onClick', 'viewCategory();');
      $('#btnMap').attr('onClick', 'viewMap();');
      $('#btnSearch').attr('onClick', 'viewSearch();');
      $('#btnProfilo').attr('onClick', 'viewProfilo();');
    }

    /*Controllo i secondi della durata del video*/
	function supportoSecondi(secondi) {
		var distance = secondi;
    $('#progressBar').attr("aria-valuemax", secondi);
    $("#progressBar").attr("aria-valuenow", distance);
    var width = 100;

		var intervallo = setInterval(function () {
			var seconds = Math.floor(distance);
			//distance -= 1;
			if (recordButton.textContent === 'Inizia a registrare') {
				clearInterval(intervallo);
        $("#progressBar").css("display", "none");
			}
			if (distance <= 0) {
				clearInterval(intervallo);
				$("#progressBar").css("display", "none");
        //bar.value = 0;
				stopRecording();
				supportoEventListener();
			} else{
        console.log(distance);
        distance--;
        width = width - width*1/seconds;
        $("#progressBar").animate({width: width + "%"}).attr("aria-valuenow", distance);
      }
		}, 1000);
		startRecording();
	}

    function controlloSecondi() {
        if (document.getElementById("Check1").checked == true) {
          supportoSecondi(16);
        }

        if (document.getElementById("Check3").checked == true) {
            var distance = 31;
            var width = 100;

            var intervallo = setInterval(function () {
                var seconds = Math.floor(distance);
                if (distance > 15) {
                    recordButton.disabled = true;
                } else {
                    recordButton.disabled = false;
                }
                if (recordButton.textContent === 'Inizia a registrare') {
          				clearInterval(intervallo);
                  $("#progressBar").css("display", "none");
          			}
                if (distance < 0) {
                    clearInterval(intervallo);
                    $("#progressBar").css("display", "none");
					          stopRecording();
					          supportoEventListener();
                } else {
                  console.log(distance);
                  distance--;
                  width = width - width*1/seconds;
                  $("#progressBar").animate({width: width + "%"}).attr("aria-valuenow", distance);
                }
            }, 1000);
            startRecording();
        }

        if (document.getElementById("Check2").checked == true) {
            if (document.getElementById("valoreDettaglio").value <= 2) {
                supportoSecondi(16);
            }
            if ((document.getElementById("valoreDettaglio").value > 2) && (document.getElementById("valoreDettaglio").value <= 4)) {
                supportoSecondi(31);
            }
            if ((document.getElementById("valoreDettaglio").value > 4) && (document.getElementById("valoreDettaglio").value <= 7)) {
                supportoSecondi(46);
            }
            if ((document.getElementById("valoreDettaglio").value > 7) && (document.getElementById("valoreDettaglio").value <= 10)) {
                supportoSecondi(61);
            }
        }

    }


    /* Utilizzo un listener sul pulsante per registrare */
    function supportoEventListener() {
        recordButton.textContent = 'Inizia a registrare';
        gumVideo.style.display = "none";
        recordedVideo.style.display = "block";
        $("#progressBar").css("width", "100%");
        playButton.disabled = false;
        deleteButton.disabled = false;
        salvaModifiche.disabled = false;
    }

    recordButton.addEventListener('click', () => {
        if (recordButton.textContent === 'Inizia a registrare') {
          $("#progressBar").css("width", "100%")
            controlloSecondi();
        } else {
            stopRecording();
            supportoEventListener();
        }
    });

    const playButton = document.querySelector('button#play');
    playButton.addEventListener('click', () => {
        const superBuffer = new Blob(recordedBlobs, {
            type: 'video/mp4'
        });
        recordedVideo.src = null;
        recordedVideo.srcObject = null;
        gumVideo.style.display = "none";
        recordedVideo.style.display = "block";
        recordButton.disabled = true;
        recordedVideo.src = window.URL.createObjectURL(superBuffer);
        recordedVideo.controls = true;
        recordedVideo.play();
    });

    function handleSourceOpen(event) {
        console.log('MediaSource opened');
        sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
        console.log('Source buffer: ', sourceBuffer);
    }

    function handleDataAvailable(event) {
        //console.log('handleDataAvailable', event);
        if (event.data && event.data.size > 0) {
            recordedBlobs.push(event.data);
        }
    }

    function startRecording() {
        recordedBlobs = [];
        let options = {
            mimeType: 'video/webm;codecs=vp9'
        };
        try {
            mediaRecorder = new MediaRecorder(window.stream, options);
        } catch (e) {
            console.error('Exception while creating MediaRecorder:', e);
        }

        console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
        recordButton.textContent = 'Fine Registrazione';
        playButton.disabled = true;
        deleteButton.disabled = true;
        recordedVideo.style.display = "none";
        gumVideo.style.display = "block";
        document.getElementById("progressBar").style.display = "block";
        mediaRecorder.onstop = (event) => {
            //mediaRecorder.stop();
            console.log('Recorder stopped: ', event);
            console.log('Recorded Blobs: ', recordedBlobs);

        };
        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.start(10); // collect 10ms of data
        console.log('MediaRecorder started', mediaRecorder);
    }

    function stopRecording() {
        mediaRecorder.stop();
				exportBlobs = recordedBlobs;
        //gumVideo.style.display = "none";
        //recordedVideo.style.display = "block";
    }

    /* Gestisco il caso in cui voglio eliminare il video appena creato */
    deleteButton.addEventListener('click', function () {
        recordedVideo.pause();
        recordedVideo.removeAttribute('src');
        recordedVideo.load();
        recordedVideo.style.display = "none";
        gumVideo.style.display = "block";
        deleteButton.disabled = true;
        recordButton.disabled = false;
        playButton.disabled = true;
        salvaModifiche.disabled = true;
        recordedBlobs = [];
        //recordedVideo.style.display = none;
    })

    function handleSuccess(stream) {
        recordButton.disabled = false;
        gumVideo.style.display = "block";
        recordedVideo.style.display = "none";
        console.log('getUserMedia() got stream:', stream);
        window.stream = stream;
        localstream = stream;

        gumVideo.srcObject = stream;
        disableButtons();
    }

    async function init(constraints) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            handleSuccess(stream);
        } catch (e) {
            console.error('navigator.getUserMedia error:', e);
        }
    }

    salvaModifiche.addEventListener('click', (e) => {
        //mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
        recordedVideo.pause();
        recordedVideo.removeAttribute('src');
        recordedVideo.load();
        recordedVideo.style.display = "none";
        gumVideo.style.display = "none";
        deleteButton.disabled = true;
        recordButton.disabled = false;
        playButton.disabled = true;
        salvaModifiche.disabled = true;
        //jQuery.noConflict();
        e.preventDefault();
        $("#videoModal").hide();
        const superBuffer = new Blob(recordedBlobs, {
            type: 'video/mp4'
        });
        anteprimaVideo.style.display = "block";
        anteprima.src = null;
        anteprima.srcObject = null;
        gumVideo.style.display = "none";
        anteprima.src = window.URL.createObjectURL(superBuffer);
        anteprima.controls = true;
        enableButtons();
    });

    eliminaModifiche.addEventListener('click', () => {
        if (recordButton.textContent != 'Inizia a registrare') {
            stopRecording();
            supportoEventListener();
        }
        stream.getTracks().forEach(track => track.stop());
        recordedVideo.pause();
        recordedVideo.removeAttribute('src');
        recordedVideo.load();
        recordedVideo.style.display = "none";
        gumVideo.style.display = "none";
        deleteButton.disabled = true;
        recordButton.disabled = false;
        playButton.disabled = true;
        salvaModifiche.disabled = true;
        recordedBlobs = [];
        enableButtons();
    });

    startButton.addEventListener('click', async () => {
        const constraints = {
            audio: true,
            video: true
        };
        console.log('Using media constraints:', constraints);
        await init(constraints);
    });



		$("#inputLocation").submit(function(e) {
     e.preventDefault();
    });

    var slider = document.getElementById("valoreDettaglio");
    var output = document.getElementById("outputValore");
    output.innerHTML = slider.value;

    slider.oninput = function() {
      output.innerHTML = this.value;
    }

}



function validateForm() {
		var isValidDescription = true;
		let nomeluogo = document.forms["formPlace"]["luogo"].value;
		let categoria = document.forms["formPlace"]["Categoria"].value;
		let pubblico = document.forms["formPlace"]["Pubblico"].value;
        let lang = document.forms["formPlace"]["formLanguage"].value;
        let mymodal = document.getElementById("myModalTitle");
        let span = document.getElementsByClassName("my-close")[0];

        span.onclick = function() {
            mymodal.style.display = "none";
        }

        // When the user clicks anywhere outside of the modal, close it
        window.onclick = function(event) {
            if (event.target == mymodal) {
                mymodal.style.display = "none";
            }
        }

		if ((nomeluogo == "") || (categoria == "") || (pubblico == "")||(lang == "")) {
				isValidDescription = false;
                mymodal.style.display = "block";
		}

		return isValidDescription;
}
