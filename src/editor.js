$(document).ready(function () {
  creaVideo();
});

var exportBlobs;

function creaVideo() {
    "use strict";
    try {
		signinCallback(gapi.client.getToken());
		} catch (e) {
		alert("errore nel caricare il token");
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


    /*Controllo i secondi della durata del video*/
	function supportoSecondi(secondi) {
		var distance = secondi;
		var intervallo = setInterval(function () {
			var seconds = Math.floor(distance - 1);
			distance -= 1;
			document.getElementById("timeVideo").innerHTML = seconds + "s ";
			if (recordButton.textContent === 'Inizia a registrare') {
				clearInterval(intervallo);
				document.getElementById("timeVideo").innerHTML = secondi-1 + "s";
			}
			if (distance < 0) {
				clearInterval(intervallo);
				document.getElementById("timeVideo").innerHTML = secondi-1 + "s";
				stopRecording();
				supportoEventListener();
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
            var intervallo = setInterval(function () {
                var seconds = Math.floor(distance - 1);
                distance -= 1;
                document.getElementById("timeVideo").innerHTML = seconds + "s ";
                if (distance > 15) {
                    recordButton.disabled = true;
                } else {
                    recordButton.disabled = false;
                }
                if (recordButton.textContent === 'Inizia a registrare') {
          				clearInterval(intervallo);
          				document.getElementById("timeVideo").innerHTML = "30s";
          			}
                if (distance < 0) {
                    clearInterval(intervallo);
                    document.getElementById("timeVideo").innerHTML = "30s";
					stopRecording();
					supportoEventListener();
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
        playButton.disabled = false;
        downloadButton.disabled = false;
        deleteButton.disabled = false;
        salvaModifiche.disabled = false;
    }

    recordButton.addEventListener('click', () => {
        if (recordButton.textContent === 'Inizia a registrare') {
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

    /* Gestione pulsante di Download */
    const downloadButton = document.querySelector('button#download');
    downloadButton.addEventListener('click', () => {
        const blob = new Blob(recordedBlobs, {
            type: 'video/mp4'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'test.mp4';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
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
        downloadButton.disabled = true;
        deleteButton.disabled = true;
        recordedVideo.style.display = "none";
        gumVideo.style.display = "block";
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
        downloadButton.disabled = true;
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
    }

    function showRecordedVideo() {
        if (recordedVideo.src !== null && recordedBlobs != undefined) {
            const buf = new Blob(recordedBlobs, {
                type: 'video/mp4'
            });
            $('#infoVideo').append(recordedVideo);
            $('#infoVideo').css("display", "block");
            //$('#recorded').addClass("fitSize");
            recordedVideo.src = window.URL.createObjectURL(buf);
            recordedVideo.style.display = 'block';
            recordedVideo.controls = true;
            recordedVideo.loop = false;
            recordedVideo.autoplay = false;
        }
    }

    async function init(constraints) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            handleSuccess(stream);
        } catch (e) {
            console.error('navigator.getUserMedia error:', e);
        }
    }

    salvaModifiche.addEventListener('click', () => {
        //mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
        recordedVideo.pause();
        recordedVideo.removeAttribute('src');
        recordedVideo.load();
        recordedVideo.style.display = "none";
        deleteButton.disabled = true;
        recordButton.disabled = false;
        downloadButton.disabled = true;
        playButton.disabled = true;
        salvaModifiche.disabled = true;
        gumVideo.style.display = 'none';
        //jQuery.noConflict();
        $('#videoModal').hide();
        anteprimaVideo.style.display = "block";
        const superBuffer = new Blob(recordedBlobs, {
            type: 'video/mp4'
        });
        anteprima.src = null;
        anteprima.srcObject = null;
        gumVideo.style.display = "none";
        anteprima.src = window.URL.createObjectURL(superBuffer);
        anteprima.controls = true;
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
        gumVideo.style.display = "block";
        deleteButton.disabled = true;
        recordButton.disabled = false;
        downloadButton.disabled = true;
        playButton.disabled = true;
        salvaModifiche.disabled = true;
        recordedBlobs = [];
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

		if ((nomeluogo == "") || (categoria == "") || (pubblico == "")||(lang == "")) {
				isValidDescription = false;
				alert("Per caricare un nuovo luogo devi inserire il nome del luogo, scegliere una categoria, selezionare un publico e scegliere una lingua.");
		}

		return isValidDescription;
}

function popoloSecondi() {
		if (document.getElementById("Check1").checked == true) {
				document.getElementById("timeVideo").innerHTML = "15s";
				document.getElementById("minimo").innerHTML = "";
				document.getElementById("mintimeVideo").innerHTML = "";
		}
		if (document.getElementById("Check3").checked == true) {
				document.getElementById("timeVideo").innerHTML = "30s";
				document.getElementById("minimo").innerHTML = "Il video deve durare minimo: ";
				document.getElementById("mintimeVideo").innerHTML = "15s";
		}
		if (document.getElementById("Check2").checked == true) {
				if (document.getElementById("valoreDettaglio").value <= 2) {
						document.getElementById("timeVideo").innerHTML = "15s";
				}
				if ((document.getElementById("valoreDettaglio").value > 2) && (document.getElementById("valoreDettaglio").value <= 4)) {
						document.getElementById("timeVideo").innerHTML = "30s";
				}
				if ((document.getElementById("valoreDettaglio").value > 4) && (document.getElementById("valoreDettaglio").value <= 7)) {
						document.getElementById("timeVideo").innerHTML = "45s";
				}
				if ((document.getElementById("valoreDettaglio").value > 7) && (document.getElementById("valoreDettaglio").value <= 10)) {
						document.getElementById("timeVideo").innerHTML = "60s";
				}
				document.getElementById("minimo").innerHTML = "";
				document.getElementById("mintimeVideo").innerHTML = "";
		}
}
