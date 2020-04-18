$(document).ready(function () {
    initMap();
});


// Mappa
var map

// Html che contiene le card con le clip da riprodurre
var clipCard = '';
var clipListHTML = '';
var i=0;
var j;
var distances = [];
var bool = {val:0};
var count = {val: 0};
var pos;
var checkbox_audience = [];
var checkbox_purpose = [];
var checkbox_language = [];
var range_slider = 0;
var filteredClips = [];
var filteredList = '';
var io = L.icon({
    iconUrl: 'io.png',
    iconSize: [25, 25], // size of the icon
});
var voice = false;


// Route vuoto
route = L.Routing.control({
    waypoints: []
})


// Pulsante Posizione Attuale
currentPositionButton = L.easyButton( /*'<p id="mapButton" color="black">X</p>' */ '<ion-icon id="mapButton" color="black" name="navigate"></ion-icon>', function () {
    if (geolocation){
        // Geolocalizzazione attiva
        updatePosition();
        map.setView(latlng);
        myPositionMarker.setLatLng(latlng);

    }else{
        // Geolocalizzazione non attiva
        latlng = myPositionMarker.getLatLng();
        lat = latlng[0];
        lng = latlng[1];
        map.setView(latlng);
        myPositionMarker.setLatLng(latlng);
    }
    searchClips();
}, {
    position: 'topright'
});

// Pulsante per rimuovere indicazioni
removeRouteButton = L.easyButton('<ion-icon id="mapButton" color="black" name="close-circle-outline"></ion-icon>', function () {
    removeRoute();
    //geocoder.show;
    map.removeControl(removeRouteButton);
}, {
    position: 'topright'
});

voiceControlButton = L.easyButton('<ion-icon id="mapButton" color="black" name="mic"></ion-icon>', function () {
    if (annyang) {
        alert('Attivo controllo vocale...');
        var commands = {
            'map': function() { viewMap();viewMap(); },
            'near me': function() { viewNearMe(); },
            'search': function() { viewSearch(); },
            'team': function() { viewCategory(); },
            'profile': function() { viewProfilo(); },
            'play': function() { playNearMe(count); },
            'stop': function() { stopAudio();  },
            'more': function() { stopAudio();playMore(contaClip);  },
            'back': function() { stopAudio(); playMoreBack(contaClip);  },
            'next': function() { stopAudio(); incr(count);playNearMe(count); },
            'where am i': function() { playNearMe(count);  },
            'alexa': function() {var msg = new SpeechSynthesisUtterance("Hai sbagliato assistente virtuale");window.speechSynthesis.speak(msg);},
            'hello () *name': alert
        };
        voice = true;
        annyang.addCommands(commands);
        annyang.start();
    }else{
        alert('Controllo vocale non disponibile su questo browser');
    }
}, {
    position: 'topright'
});

var initMap = () => {
    $('#mapid').empty()
    // Setto la mappa
    map = L.map('mapid', {
        center: [44.5075, 11.35],
        zoom: 19,
        attributionControl: false,
        zoomControl: false
    });

    L.tileLayer('https://api.mapbox.com/styles/v1/mattiaceluno/ck263uc6k08xu1cpiog49klp4/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibWF0dGlhY2VsdW5vIiwiYSI6ImNrMjYxb3Z1bjE5Y2IzY21xZW1laTZjdHcifQ.-tO_ahzF55IoOpnPtMH0VQ', {
        attribution: '',
        maxZoom: 20,
        id: 'mapbox.streets',
    }).addTo(map);

    // Controlli per lo zoom
    zoomButton = L.control.zoom({
        position: 'topright',
    }).addTo(map);

    // Reimposta mappa sulla posizione attuale
    currentPositionButton.addTo(map);

    // Abilita controllo vocale su browser compatibili
    voiceControlButton.addTo(map);

    // Metto marker posizione
    myPositionMarker = new L.Marker([0,0], {
        draggable: true,
        autoPan: true,
        icon: io,
    }).addTo(map);

    //Sposto il marker della mia posizione ed escono nuove clips
    myPositionMarker.on('moveend', function (e) {
        distances = [];
        clipListHTML = '';
        latlng = myPositionMarker.getLatLng();
        lat = latlng[0];
        lng = latlng[1];
        searchClips();
        console.log(places);
        console.log(clips);
        count = {val: 0};
    });

    // Impostazione della mappa
    if (navigator.geolocation){
        navigator.geolocation.getCurrentPosition(function (location) {
            // Geolocalizzazione attiva
            console.log(" -- Geolocalizzazione attiva");
            window.geolocation = true;
            // Prendo posizione : latitudine e longitudine
            window.latlng = new L.LatLng(location.coords.latitude, location.coords.longitude);
            window.lat = location.coords.latitude;
            window.long = location.coords.longitude;
            //myPositionMarker.setLatLng(latlng);
            //map.setView(latlng);
            setTimeout(function(){
                myPositionMarker.setLatLng(latlng);
                map.setView(latlng);
                searchClips();
            }, 1000);
        }, function(){
            // Geolocalizzazione non attiva
            console.log(" -- Geolocalizzazione non attiva");
            window.geolocation = false;
            // latlnf di default
            window.latlng = [44.4938100, 11.3428600];
            window.lat = latlng[0];
            window.long = latlng[1];
            myPositionMarker.setLatLng(latlng);
            map.setView(latlng);
            searchClips();
        });
    }


    map.on('zoomend', function() {
        searchClips();
    });

    window.geocoder = L.Control.geocoder({
        defaultMarkGeocode: false,
        position: "topleft",
        errorMessage: "Nessun risultato trovato :(",
    }).on('markgeocode', function(e) {
        latlng = e.geocode.center;
        map.setView(e.geocode.center);
        myPositionMarker.setLatLng(e.geocode.center);
        searchClips();
    }).addTo(map);


}// initMap

// Imposta una route sulla mappa
var getRoute = (e) => {
    map.closePopup();
    map.removeControl(geocoder);
    // Cancello il controllo route vecchio
    map.removeControl(route);

    options = {
        profile: 'mapbox/walking',
        language: 'it'
    }

    route = L.Routing.control({
        position: 'topleft',
        waypoints: [
            L.latLng(myPositionMarker.getLatLng()),
            L.latLng(e) //features.geometry.coordinates[1], features.geometry.coordinates[0])
        ],
        router: new L.Routing.mapbox('pk.eyJ1IjoibWF0dGlhY2VsdW5vIiwiYSI6ImNrMjYxb3Z1bjE5Y2IzY21xZW1laTZjdHcifQ.-tO_ahzF55IoOpnPtMH0VQ', options),
        lineOptions: {
            styles: [{
                color: '#FF2E55'
            }]
        },
        routeWhileDragging: false,
        autoRoute: true,
    }).addTo(map);

    map.removeControl(myPositionMarker);
    removeRouteButton.addTo(map);
    viewMap();
}

// Rimuove una route dalla mappa
var removeRoute = () => {
    geocoder.addTo(map);
    myPositionMarker.addTo(map);
    map.removeControl(route);
}

// Aggiorna la posizione reale dell'utente
var updatePosition = () => {
    navigator.geolocation.getCurrentPosition(function (location){
        window.latlng = new L.LatLng(location.coords.latitude, location.coords.longitude);
        window.lat = location.coords.latitude;
        window.long = location.coords.longitude;
    })
}

// STRUTTURE DATI LUOGHI E CLIP
var places = [];

// Oggetto per rappresentare un singolo luogo
function place (name,olc) {
    this.name = name;
    this.olc = olc
    this.distance = 0;
    // array di clip divisi per purpose
    this.what = [];
    this.how = [];
    this.why = [];
    //this.distance = parseInt(getDistance(latlng,OpenLocationCode.decode(this.olc)));
    clipPosition = OpenLocationCode.decode(this.olc);
    this.clipPos = '[' + clipPosition.latitudeCenter +',' + clipPosition.longitudeCenter + ']';



    this.latlng = function(){
        clipPosition = OpenLocationCode.decode(this.olc);
        return [clipPosition.latitudeCenter,clipPosition.longitudeCenter];
    }

    clipPosition = OpenLocationCode.decode(this.olc);
    this.clipPos = '[' + clipPosition.latitudeCenter +',' + clipPosition.longitudeCenter + ']';

    this.addClip = function(clip){
        // Decidere se confrontare nome o olc
        // per nome sembra meglio, da verificare
        // basta cambiare questo confronto
        if (this.name.toLowerCase() == clip.title.toLowerCase()){
            switch (clip.purpose) {
				case "Che cosa":
					this.what.push(clip);
					break;
                case "Come":
    				this.how.push(clip);
    				break;
                case "Perché":
    				this.why.push(clip);
    				break;
            }
            return true;
        }
        return false;
    }

    this.removeClip = function(videoID, purpose){
        this[purpose].forEach((c, i) => {
            if (c.videoID == videoID){
                this[purpose].splice(i, 1);
                localStorage.setItem(videoID,"True");
            }
        });
    }
}

function removeClipPlaces(videoID,purpose){
    places.forEach((p, i) => {
        p.removeClip(videoID,purpose);
    });
}


function addToPlaces(clip){
    added = false;
    places.forEach((p, i) => {
        if (p.addClip(clip)){added=true;}
    });
    if (!added){
        newPlace = new place(clip.title,clip.olc);
        newPlace.addClip(clip);
        places.push(newPlace);
    }
}

function removeClipPlaces(videoID,purpose){
    places.forEach((p, i) => {
        p.removeClip(videoID,purpose);
    });
}

// Array di tutte le clip
var clips = [];
var seenClips = [];
// Oggetto per rappresentare la singola clip
function clip(title, videoID, olc, purpose, content, language, audience,detail, description, distance){
    this.title = title;
    this.videoID = videoID;
    this.olc = olc;
    this.purpose = purpose;
    this.content = content;
    this.language = language;
    this.audience = audience;
    this.detail = detail;
    this.description = description;
    this.latlng = function(){
        clipPosition = OpenLocationCode.decode(this.olc);
        return [clipPosition.latitudeCenter,clipPosition.longitudeCenter];
    }

    clipPosition = OpenLocationCode.decode(this.olc);
    this.distance = parseInt(getDistance(latlng,OpenLocationCode.decode(this.olc)));
    this.clipPos = '[' + clipPosition.latitudeCenter +',' + clipPosition.longitudeCenter + ']';
}

function resetSeen(){
    seenClips.forEach((c, i) => {
        localStorage.setItem(c.videoID, "");
    });
    searchClips();
}



var searchClips = () => {
    j=0;
    i=0;
    // Ottengo Plus Code da lat e lng
    var markerLat = myPositionMarker.getLatLng().lat;
    var markerLng = myPositionMarker.getLatLng().lng;

    // Precisione della ricerca
    var precision =6;

    if (map.getZoom() == 20) precision = 10;
    else if (map.getZoom() == 19 ) precision = 8
    else if (map.getZoom() == 18 ) precision = 8
    else if (map.getZoom() == 17 ) precision = 8


    // CON 8 TROVA PIÙ CLIP

    var query = OpenLocationCode.encode(markerLat,markerLng, precision);

    // Chiave API Google
    var apikey = "AIzaSyCOU7MHNBD0JwE7ThBRx2kocrI7Gne2NVg";

    // Limite al numero dei risultati
	var maxResults = 50;
	request = "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + query + "&key=" + apikey + "&maxResults=" + maxResults;

    // Reset marker sulla mappa per evitare duplicati
    places.forEach((p, i) => {
        marker = window[p.name];
        map.removeControl(marker);
    });

	$.getJSON(request, function (resObj) {
		var clipList = resObj.items;
        // Controllo ogni risultato della ricerca per capire se è una clip
		$.each(clipList, function (index) {
            // Ottengo Titolo e ID del video
            var title = clipList[index].snippet.title;
            var titleFinal = title.split(":")[0];

            // Pulizia dei titoli delle clip
            if (titleFinal.includes("#")) titleFinal = titleFinal.split("#")[0];
            if (titleFinal.includes("-")) titleFinal = titleFinal.split("-")[0];
            if (titleFinal.includes("what")) titleFinal = titleFinal.split("what")[0];
            if (titleFinal.includes("What")) titleFinal = titleFinal.split("What")[0];
            if (titleFinal.includes("why")) titleFinal = titleFinal.split("why")[0];
            if (titleFinal.includes("Why")) titleFinal = titleFinal.split("Why")[0];
            if (titleFinal.includes("how")) titleFinal = titleFinal.split("how")[0];
            if (titleFinal.includes("How")) titleFinal = titleFinal.split("How")[0];
            if (titleFinal.includes("Curiosità")) return false;
            if (titleFinal.includes("Come")) return false;

            // Scarto le clip che hanno come titolo un plus code
            // if (/([23456789C][23456789CFGHJMPQRV][23456789CFGHJMPQRVWX].*$)/.test( titleFinal )) {
            //     console.log(" Plus code nel titolo della clip: "+ titleFinal + " rifiutato");
            //     return true;
            // };
            // if (titleFinal=='') return false;



            // DA GUARDARE QUA
            // Maiuscola dopo lo spazio
            function titleCase(str) {
                var splitStr = str.toLowerCase().split(' ');
                for (var i = 0; i < splitStr.length; i++) {
                    splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
                }
                return splitStr.join(' ');
            }
            // Spazio prima della maiscola
            function insertSpaces(string) {
                string = string.replace(/([a-z])([A-Z])/g, '$1 $2');
                string = string.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
                return string;
            }

            titleFinal = insertSpaces(titleFinal);
            titleFinal = titleCase(titleFinal);
            titleFinal = titleFinal.replace(/\s+/g, '');
            titleFinal = titleFinal.replace(/([A-Z])/g, ' $1').trim()
            //METTERE TUTTI I TITOLI CON LO STESSO STILE, PRIMA LETTERA DI OGNI PAROLA MAIUSCOLA



            // YouTube Video ID
            var clipID = clipList[index].id.videoId;

            // Controllo per evitare di aggiungere più volte le stesse clip
            var alreadyFound = false;
            clips.forEach((c, i) => {
                if (c.videoID == clipID) {
                    alreadyFound = true;
                    return false;
                }
            });
            if (alreadyFound) return false;

            // Descrizione
            var clipDescription = clipList[index].snippet.description;
			var clipTitle = clipList[index].snippet.title;
            if (clipDescription.split(":").length < 6) {
				console.log(" Clip: '" + clipTitle + "', videoID '"+ clipID +"' : metadati non compatibili");
				return true;
			}

            // Purpose
			var lookForPurposes = ["what","why","how","where"];
			if ( lookForPurposes.includes( titleFinal.toLowerCase() ) ) titleFinal = title.split(":")[1];

            // olc
            var olc = clipList[index].snippet.description;
			var olcSplit = olc.split(":")[0];


            //Controllo per assicurarmi che la clip contenga un olc ben formato
            var olcSemiFinal = olcSplit.split('-');
            var olcSemiFinalLength = olcSemiFinal[olcSemiFinal.length - 1];

			//controllo se c'e' un punto alla fine dell'OLC
			function olcChecker(olcToCheck) {
				if (olcToCheck.slice(-1) == '.') {
					var plusCodeSliced = olcToCheck.slice(0, -1);
					console.log('plus code sliced is ' + plusCodeSliced);
					var IsPlus = '+';
					var concatPlusStrnz = plusCodeSliced.concat(IsPlus);
					olcFinal = concatPlusStrnz;
				} else {
					olcFinal = olcSemiFinalLength;
				}
			}
			olcChecker(olcSemiFinalLength);

            // LatLng della clip
			var clipPosition;

            try {
                clipPosition = OpenLocationCode.decode(olcFinal);
            }
            catch(err) {
                console.log("OLC non valido per clip: "+ titleFinal);
                return false;
            }

            // Purpose clip
			var purpose = clipList[index].snippet.description;
			var purposeRaw = purpose.split(":")[1];
			var purposesList = {what:"Che cosa", how:"Come", why:"Perché"};
			var purposeFinal = purposesList[purposeRaw];

            var distance = parseInt(getDistance(latlng, clipPosition));

            // Language info
			var language = clipList[index].snippet.description;
			var languageFinal = language.split(":")[2];
			switch (languageFinal) {
				case "ita":
					languageFinal = "Italiano";
					break;
				case "eng":
					languageFinal = "English";
					break;
                case "fra":
                    languageFinal = "Français";
                    break;
			}

            // Categorizzazione clip
			var content = clipList[index].snippet.description;
			var categoriesList = {all:"Tutte", none:"None", nat:"Natura", art:"Arte", his:"Storia", flk:"Folklore", mod:"Cultura Moderna", rel:"Religione", cui:"Cucina", spo:"Sport", mus:"Music", mov:"Film", fas:"Moda", shp:"Shopping", tec:"Tecnologia", pop:"Cultura pop e gossip", prs:"Esperienze personali", oth:"Altro"};
			var contentFinal = categoriesList[content.split(":")[3]];

            // Audience Clip
			var audience = clipList[index].snippet.description;
			var audienceFinal = audience.split(":")[4];
			switch (audienceFinal) {
				case "asilo":
					audienceFinal = "Asilo";
					break;
                case "apre":
    				audienceFinal = "Asilo";
    				break;
                case "Apre":
                    audienceFinal = "Asilo";
                    break;
				case "elementare":
					audienceFinal = "Elementare";
					break;
                case "elm":
                    audienceFinal = "Elementare";
    				break;
				case "superiore":
					audienceFinal = "Scuola superiore";
					break;
                case "mid":
    				audienceFinal = "Medie";
    				break;
				case "altroTarget":
					audienceFinal = "Altro";
					break;
                case "gen":
    				audienceFinal = "Generale";
    				break;
                case "A+gen":
        			audienceFinal = "Generale";
        			break;
                case "Agen":
            		audienceFinal = "Generale";
            		break;
                case "Aall":
                	audienceFinal = "Generale";
                	break;
                case "scl":
            		audienceFinal = "Specialisti del settore";
            		break;
			}

			var detail = clipList[index].snippet.description;
			var det = detail.split("%%%")[0];
			var detailsList = ["Non disponibile", "Breve", "Normale", "Approfondito", "Super Quark"];
			var detailFinal = 0;

			var descriptionFinal = "Descrizione non disponibile";
            if (det.split(":").length == 7) {
				detailFinal = detailsList[ parseInt( det.split(":")[5] ) ];
				descriptionFinal = det.split(":")[6];
			}

			if (det.split(":").length == 6) {
				detailFinal = det.split(":")[5];
				descriptionFinal = detailFinal.split("#")[1];
				detailFinal = detailFinal.split("#")[0];
				if (detailFinal == "default")
					detailFinal = detailsList[0];
				else
					detailFinal = detailsList[ parseInt( detailFinal.split("#")[0].match(/\d+/) ) ];
			}else{
                if (det.split(":").length == 7) {
                    detailFinal = detailsList[ parseInt( det.split(":")[5] ) ];
                    descriptionFinal = det.split(":")[6];
                }else{
                    return 0;
                }
            }

			if (typeof detailFinal === "undefined") detailFinal = detailsList[0];
            if (typeof descriptionFinal === "undefined") descriptionFinal = "Descrizione non disponibile.";

            var newClip = new clip(titleFinal, clipID, olcFinal, purposeFinal, contentFinal, languageFinal, audienceFinal, detailFinal, descriptionFinal)
            console.log(" creata clip "+ titleFinal);

            var seen = localStorage.getItem(clipID);
            if (seen == "True"){
                console.log(" Clip "+ titleFinal + " già visualizzata");
                seenClips.push(newClip);
                return false;
            }

            clips.push(newClip);
            addToPlaces(newClip);


            imgwiki = {img:''}
        });


        places.forEach((p, i) => {
                    p.distance = parseInt(getDistance(latlng,OpenLocationCode.decode(p.olc)));
        });

        function compare(a, b) {
            const distA = a.distance;
            const distB = b.distance;

            let comparison = 0;
            if (distA > distB) {
                comparison = 1;
            } else if (distA < distB) {
                comparison = -1;
            }
            return comparison;
        }
        places.sort(compare);

        var populateNearMe = (p,c) => {
            // Per evitare di ricontrollare tutta la lista dei video trovati dopo,
            // per ogni clip trovata creo una card da caricare nella pagina nearMe.
            imgUrl = c.title;

            imgUrl = imgUrl.replace(/ /g,"");
            imgUrl = imgUrl.toLowerCase();
            pos = p.latlng();

            clipCard = `<div class="col-12 col-sm-6 space col-md-4 col-lg-4 col-xl-4" >
                        <div id="cardID" class="card cardcontainer" style="background-color:#555 ;background-image:url(/images/` + imgUrl +  `.jpeg); background-size:cover">
                        <div class="overlay">
                        <div class="card-body">
                        <h5 class="card-title color-white ">` + c.title + `</h5>
                        <h6 class="card-subtitle mb-2 color-white">` + c.language + `</h6>
                        <p class="card-text color-white">Distanza: <b>` + p.distance + `m</b></p>
                        <p class="card-text color-white">Audience: <b>` + c.audience + `</b></p>
                        <p class="card-text color-white">Purpose: <b>` + c.purpose + `</b></p>
                        <span id="play`+ c.videoID +`"  onclick="playAudio(\'` + c.videoID+ `\');">
                         <ion-icon name="play-circle" style="font-size:25px;color:#fff;margin-right:10px"></ion-icon>
                        </span>
                        <span id="pause`+ c.videoID +`" class="hide" onclick="stopAudio(\'` + c.videoID+ `\');">
                          <ion-icon name="pause"  style="font-size:25px;color:#fff;margin-right:10px"></ion-icon>
                        </span>
                        </div></div></div></div>
                    `;
            // Aggiungo la card alle altre
            clipListHTML += clipCard;
        }


        places.forEach((p, j) => {

            p.what.forEach((c, k) => {
                //faccio colonne da 3
                if (i==0){
                    clipListHTML += '<div class="row" style="margin: 2% 2% 2% 2%">'
                }
                populateNearMe(p,c);
                i++;

                if (i==3) {
                    clipListHTML += '</div>'
                    i=0;
                }
            });

            p.how.forEach((c, k) => {
                //faccio colonne da 3
                if (i==0){
                    clipListHTML += '<div class="row" style="margin: 2% 2% 2% 2%">'
                }
                populateNearMe(p,c);

                i++;

                if (i==3) {
                    clipListHTML += '</div>'
                    i=0;
                }
            });

            p.why.forEach((c, k) => {
                //faccio colonne da 3
                if (i==0){
                    clipListHTML += '<div class="row" style="margin: 2% 2% 2% 2%">'
                }
                populateNearMe(p,c);

                i++;

                if (i==3) {
                    clipListHTML += '</div>'
                    i=0;
                    }
            });




            window[p.name] = new L.CircleMarker(p.latlng(), {
                radius: 5,
                fillOpacity: 0.20,
                color: 'white',
            }).on('click', e => {
                viewPlace(p);
            }).on('mouseover', function(e) {
                pos = e.latlng;

                //thisClip = newClip;
                //open popup;
                var popup = L.popup()
                .setLatLng(e.latlng)
                .setContent(`<div class="container" style="width:300px;"><div class="row"> <b> Distanza: </b> `+ p.distance +`m</div><div class="row"><h1 style="font-size:20px; color:#000;"> ` + p.name + `</h1></div><div class="row"><div class="col-4"><a href="#" class="indicazioni">Indicazioni </a></div> <div class="col-4"><a href="#" class="dettagli"> Vedi dettagli </a> </div> </div></div>`)
                .openOn(map)

                $(".indicazioni").on("click", n => {
                    viewMap();
                    getRoute(pos);
                });
                $(".dettagli").on("click", n  => {
                    viewPlace(p);
                });

            }).addTo(map);
        });
    });

}

var viewPlace = (p) => {

    // Sono un html molto brutto, qualcuno che ne sa di html/css mi rendere più bello? Grazie
    var myPoint = `
        <div class="closePoint" style="position:fixed;  font-size:25px; top:10px; right:10px; "><a href="#" style="color:#fff; text-decoration:none;" onclick="viewMap();viewMap();"><ion-icon ios="ios-close-circle" md="md-close-circle" style="color:#FF2E55!important"></ion-icon></a></div>
        <header id="imgHead" style="height: 20vh;min-height: 500px; background-size: cover;background-position: center;background-repeat: no-repeat;">
        <div class="container h-100"><div class="row h-100 align-items-center"><div class="col-12 text-center">
        <h1 style="font-size:70px; color:#fff;">` + p.name + `</h1>
        </div>
        <div class="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-xs-12" style="text-align:right">
        <a href="#" style="text-decoration:none; color:#FF2E55; font-size:20px;" class="searchWiki"> <ion-icon name="book"></ion-icon> Cerca su Wikipedia </a>
        </div>
        <div class="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-xs-12" style="text-align:left">
        <a href="#" style="text-decoration:none; color:#FF2E55; font-size:20px;" class="indicazioni"> <ion-icon name="navigate"></ion-icon> Ottieni indicazioni</a>
        </div></div></div></header>
        <!-- Page Content -->

        <section class="py-5" >

        <h2 style="color:#777;font-size:50px ;padding-left:3%"> What </h2>
        <div id="what" style="   display:flex; flex-wrap: nowrap; overflow-x:auto; white-space: nowrap;.card {flex: 0 0 auto;}">

        </div>

        <h2 style="color:#777 ;font-size:50px ; padding-left:3%; padding-top:3%"> Why </h2>
        <div id="why" style=" display:flex; flex-wrap: nowrap; overflow-x:auto; white-space: nowrap;.card {flex: 0 0 auto;}">


        </div>

        <h2 style="color:#777;font-size:50px ; padding-left:3%;padding-top:3%"> How </h2>
        <div id="how" style="  display:flex; flex-wrap: nowrap; overflow-x:auto; white-space: nowrap;.card {flex: 0 0 auto;}">

        </div>
        <div class="container">
        <div class="modalWiki">
        <div class="modalContentWiki">
        <span class="closeButtonWiki" onclick = 'modal.classList.toggle("showModalWiki");window.speechSynthesis.cancel();'>&times;</span>
        <h1>Wikipedia</h1>
        <div class="contentWiki"></div>
        </div>

        </div>


        </div></section>`;

    $("#point").html(myPoint);

    function createCard(purpose){
        p[purpose].forEach((c, i) => {
            imgUrl = c.title;
            imgUrl = imgUrl.replace(/ /g,"");
            imgUrl = imgUrl.toLowerCase();

            // Meglio colore come sfondo clip? Le immagini sarebbero tutte ripetute
            clipCard =   `
                    <div style="width:100%;  margin:1% 2%;padding: 5% auto; ">

                    <div class="w-100 list-group-item list-group-item-action flex-column align-items-start bg-black color-white">
                    <div class=" w-100 justify-content-between">
                    <small> Purpose: <b>`+c.purpose +`</b> | Audience: <b>`+c.audience +`</b> | Language: <b>`+c.language +` </b></small>

                    <h2 class="mb-1">`+c.title +`</h2>
                    </div>
                    <p class="mb-1">`+c.description +`</p>
                    <span id="play`+ c.videoID +`"  onclick="playAudio(\'` + c.videoID+ `\');">
                     <ion-icon name="play-circle" style="font-size:25px;color:#FF2E55;margin-right:10px"></ion-icon>
                    </span>
                    <span id="pause`+ c.videoID +`" class="hide" onclick="stopAudio(\'` + c.videoID+ `\');">
                      <ion-icon name="pause"  style="font-size:25px;color:#FF2E55;margin-right:10px"></ion-icon>
                    </span>
                    <span id="delete" onclick="removeClipPlaces(\'` + c.videoID+ `\',\'` + purpose + `\');">
                                 <ion-icon name="close-circle-outline"  style="font-size:25px;color:#FF2E55;margin-right:10px""></ion-icon>
                               </span>

                    </div></div>`
            $("#"+purpose).append(clipCard);
        });
    }
    createCard("what");
    createCard("why");
    createCard("how");

    pos = p.latlng();
    $(".indicazioni").on("click", e => {
        viewMap();
        viewMap();
        getRoute(pos);

    });

    $(".searchWiki").on("click", e =>{
        modal = document.querySelector(".modalWiki");
        closeButton = document.querySelector(".closeButtonWiki");
        function toggleModalWiki(){
            modal.classList.toggle("showModalWiki");
        }
        function windowOnClick(event) {
            if (event.target === modal) {
                toggleModalWiki();
            }
        }
        //closeButton.addEventListener("click", toggleModalWiki);
        window.addEventListener("click", windowOnClick);
        toggleModalWiki();
        searchWiki(p.name);
    });
    // Ricerca immagine su wikipedia
    searchImgWiki(p.name);
    viewPoint();



};


var imgwiki = {img:''};

// Funzione che visualizza la pagina di dettaglio dei vari punti d'interesse
var viewDetail = (c) => {
    imgwiki = {img:''}

    // Link al video della clip
    var youtube = `https://www.youtube.com/embed/`+ c.videoID;
    // var img = searchImg(titleFinal);

    var myPoint = `
        <div class="closePoint" style="position:fixed;  font-size:25px; top:10px; right:10px; "><a href="#" style="color:#fff; text-decoration:none;" onclick="viewMap();viewMap();"><ion-icon ios="ios-close-circle" md="md-close-circle" style="color:#FF2E55!important"></ion-icon></a></div>
        <header id="imgHead" style="height: 20vh;min-height: 500px; background-size: cover;background-position: center;background-repeat: no-repeat;">
        <div class="container h-100"><div class="row h-100 align-items-center"><div class="col-12 text-center">
        <h1 style="font-size:70px; color:#fff;">` + c.title + `</h1>
        <p class="lead" style="color:#fff;font-size:20px;"> ` + c.description + `</p>
        <p class="lead" style="color:#fff"font-size:10px>  <b>` + c.language + `</b></p>
        </div></div></div></header>
        <!-- Page Content -->
        <section class="py-5">

        <div class="container">
        <div class="modalWiki">
        <div class="modalContentWiki">
        <span class="closeButtonWiki" onclick = 'modal.classList.toggle("showModalWiki");window.speechSynthesis.cancel();'>&times;</span>
        <h1>Wikipedia</h1>
        <div class="contentWiki"></div>
        </div>

        </div>
        <h2 style="color:#fff;"> Informazioni Clip </h2>
        <p class="lead" style="color:#fff"> <b> Content: </b>` + c.content + `</p>
        <p class="lead" style="color:#fff"> <b> Purpose: </b>` + c.purpose + `</p>
        <p class="lead" style="color:#fff"> <b> Audience: </b>` + c.audiance + `</p>
        <p class="lead" style="color:#fff"> <b> Detail: </b>` + c.detail + `</p>

        <a href="#" style="text-decoration:none; color:#FF2E55; font-size:20px;" class="seen"> <ion-icon name="eye"></ion-icon> Segna come visto <br><br></a>
        <a href="#" style="text-decoration:none; color:#FF2E55; font-size:20px;" class="searchWiki"> <ion-icon name="book"></ion-icon> Cerca su Wikipedia <br><br></a>
        <a href="#" style="text-decoration:none; color:#FF2E55; font-size:20px;" class="playClipButton"> <ion-icon name="play"></ion-icon> Riproduci Clip <br><br></a>
        <a href="#" style="text-decoration:none; color:#FF2E55; font-size:20px;" class="indicazioni"> <ion-icon name="navigate"></ion-icon> Ottieni indicazioni</a>
        </div></section>`;
    $("#point").html(myPoint);

    if (voice){
        var commands = {
            'info clip': function(){
                var msg = new SpeechSynthesisUtterance(titleFinal + ".Purpose " + purposeFinal + ".Content " + contentFinal + ".Audience " + audienceFinal + ".Descrizione" + descriptionFinal);
                window.speechSynthesis.speak(msg);
            }
        };
        annyang.addCommands(commands);
    }
    pos = c.latlng;
    $(".indicazioni").on("click", e => {
        viewMap();
        if (bool.val == 1){
            var latSemiFinal = pos.split(",")[0];
            var latFinal = latSemiFinal.split("[")[1];
            var lngSemiFinal = pos.split(",")[1];
            var lngFinal = lngSemiFinal.split("]")[0];
            var posFinal = {lat: latFinal, lng:lngFinal};
            getRoute(posFinal);
        } else  getRoute(pos);

    });

    $(".playClipButton").on("click", e => {
        $("#point").append(`<div class="container" style="color:#fff"> <iframe  style="width:100%;height:600px;"  src="`+youtube+`?autoplay=1" allow='autoplay' frameborder=”0″></iframe></div>`);
    });

    $(".seen").on("click", e => {
        marker = window[c.videoID];
        localStorage.setItem(c.videoID,"True");
        map.removeControl(marker);
        map.closePopup();
        viewMap();
    });

    $(".searchWiki").on("click", e =>{
        modal = document.querySelector(".modalWiki");
        closeButton = document.querySelector(".closeButtonWiki");
        function toggleModalWiki(){
            modal.classList.toggle("showModalWiki");
        }
        function windowOnClick(event) {
            if (event.target === modal) {
                toggleModalWiki();
            }
        }
        //closeButton.addEventListener("click", toggleModalWiki);
        window.addEventListener("click", windowOnClick);
        toggleModalWiki();
        searchWiki(c.title);
    });
    // Ricerca immagine su wikipedia
    searchImgWiki(c.title);
    viewPoint();

};


var searchWiki = (name) => {
    // Per cercare il nome della query
    // deve avere le prime lettere tutte maiuscole
    // e underscore al posto degli spazi bianchi
    // es. "Piazza_Maggiore"
    function titleCase(str) {
        var splitStr = str.toLowerCase().split(' ');
        for (var i = 0; i < splitStr.length; i++) {
            splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
        }
        return splitStr.join(' ');
    }
    // Aggiungo degli spazi prima di tutte le lettere maiuscole
    name = name.replace(/([A-Z])/g, ' $1').trim()
    name = titleCase(name);
    // Sostituisco gli spazi con underscore
    name = name.replace(/ /g,"_");
    content = document.querySelector(".contentWiki");

    url = "https://it.wikipedia.org/api/rest_v1/page/summary/" + name;
    // SAREBBE MEGLIO USARE QUESTO PER LA RICERCA, da capire come si usa
    //url = "http://lookup.dbpedia.org/api/search/KeywordSearch?QueryClass=place&QueryString=" + name;

    $.ajaxSetup({
        "headers":{
            Accept: "application/json"
        },
        "error":function() { content.innerText =  "Pagina non trovata :'( "; }
    });

    try {
        $.getJSON(url, function (data) {
            content.innerText =  data["extract"];
            var msg = new SpeechSynthesisUtterance(data["extract"]);
            window.speechSynthesis.speak(msg);
        });
    }
    catch(err) {
        console.log("Pagine wikipedia non trovata "+ name);

    }

}

var searchImgWiki = (name) => {
    // Per cercare il nome della query
    // deve avere le prime lettere tutte maiuscole
    // e underscore al posto degli spazi bianchi
    // es. "Piazza_Maggiore"
    function titleCase(str) {
        var splitStr = str.toLowerCase().split(' ');
        for (var i = 0; i < splitStr.length; i++) {
            splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
        }
        return splitStr.join(' ');
    }
    // Aggiungo degli spazi prima di tutte le lettere maiuscole
    name = name.replace(/([A-Z])/g, ' $1').trim()
    name = titleCase(name);
    // Sostituisco gli spazi con underscore
    name = name.replace(/ /g,"_");

    $.ajaxSetup({
        "error":function() { console.log("Pagina wikipedia non trovata:" + name) }
    });

    try {
        $.getJSON("https://it.wikipedia.org/api/rest_v1/page/summary/" + name , function (data) {
            if (typeof data.originalimage.source === 'undefined') return false;
            imgwiki.img = data.originalimage.source;
            $('#imgHead').css('background-image', `url(` + imgwiki.img +  `)`);
        });
    } catch (e) {
        console.log("Pagina wikipedia non trovata:" + name)
    }


}


//ritorna distanza in metri da due punti
var getDistance = (origin, destination) => {
    var lon1 = toRadian(origin.lng),
    lat1 = toRadian(origin.lat),
    lon2 = toRadian(destination.longitudeCenter),
    lat2 = toRadian(destination.latitudeCenter);


    var deltaLat = lat2 - lat1;
    var deltaLon = lon2 - lon1;

    var a = Math.pow(Math.sin(deltaLat/2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(deltaLon/2), 2);
    var c = 2 * Math.asin(Math.sqrt(a));
    var EARTH_RADIUS = 6371;
    return c * EARTH_RADIUS * 1000;
}
function toRadian(degree) {
    return degree*Math.PI/180;
}

//ordino array
var ordinaArray = (array) => {
    do {
        swapped = false;
        for (let i = 0; i < array.length-1; i++) {
            if (array[i].distance > array[i + 1].distance) {
                let tmp = array[i];
                array[i] = array[i + 1];
                array[i + 1] = tmp;
                swapped = true;
            }
        }
    }while (swapped);
    return array;
}


var orderedClips = [];

var ordinaClips = () => {
  for (var i = 0; i < clips.length; i++) {
    if(places[count.val].name == clips[i].title) {
        if(clips[i].purpose == 'Che cosa') {
          orderedClips[0] = clips[i];
        }
        else  if(clips[i].purpose == 'Come') {
          orderedClips[1] = clips[i];
       }
        else  if(clips[i].purpose == 'Perché') {
          orderedClips[2] = clips[i];
      }
    }
  }
}


var contaClip = {val:0};

var playMore = (contaClip) => {

  contaClip.val ++;
  if (contaClip.val < 2 && orderedClips[contaClip.val] != null) {
    playAudio(orderedClips[contaClip.val].videoID);
    $('.infoPurpose').html('<b> Purpose </b>' + orderedClips[contaClip.val].purpose);

  }
  else if (contaClip.val == 2 && orderedClips[contaClip.val] != null) {
    playAudio(orderedClips[contaClip.val].videoID);
    $('.infoPurpose').html('<b> Purpose </b>' + orderedClips[contaClip.val].purpose);

  }
  else
    alert("Non ci sono più clip per questa location");

}


var playMoreBack = (contaClip) => {

  contaClip.val --;
  if (contaClip.val > 0 && orderedClips[contaClip.val] != null) {
    playAudio(orderedClips[contaClip.val].videoID);
    $('.infoPurpose').html('<b> Purpose </b>' + orderedClips[contaClip.val].purpose);

  }
  else if (contaClip.val == 0 && orderedClips[contaClip.val] != null) {
    playAudio(orderedClips[contaClip.val].videoID);
    $('.infoPurpose').html('<b> Purpose </b>' + orderedClips[contaClip.val].purpose);

  }
  else
    alert("Questa è già la prima clip");

}


var incr = () =>{
  count.val++;
  contaClip.val = 0;
}

var decr = () =>{
  count.val--;
  contaClip.val = 0;
}
// funzione che riproduce la prima clip sul luogo corrente
var playNearMe = (count) => {
    var posizione = [];
orderedClips = [];
ordinaClips();

if (orderedClips[contaClip.val] != null)
    playAudio(orderedClips[contaClip.val].videoID)
else if (orderedClips[contaClip.val+1] != null) {
    playAudio(orderedClips[contaClip.val+1].videoID);
    contaClip.val++;
}
else if (orderedClips[contaClip.val+2] != null){
    playAudio(orderedClips[contaClip.val+2].videoID);
    contaClip.val = contaClip.val + 2;
}


    $('.infoTitle').html(places[count.val].name);
    $('.infoDistance').html('<b> Distanza </b>' + parseInt(places[count.val].distance) +'m');
    $('.infoPurpose').html('<b> Purpose </b>' + orderedClips[contaClip.val].purpose);
    // else alert ("In questa location non viene specificata la purpose della clip")
    posizione[count.val] =  '[' + places[count.val].latlng.latitudeCenter +','+ places[count.val].latlng.longitudeCenter +']';
    $('.infoIndicazioni').html(`<a style="color:#FF2E55; font-weight:600;" onclick="getRoute(`+places[count.val].clipPos+` )"> Raggiungi location </a>`);
    $('#play').addClass('hide');
    $('#pause').removeClass('hide');
}
var playClip = {clip: ''};
//quando premi play
var playAudio = (e) =>{

    playClip.clip = e;

    play();

    $(`#play`+ e).addClass('hide');
    $('#pause'+e).removeClass('hide');
    $(`#play`).addClass('hide');
    $('#pause').removeClass('hide');
}


//quando premi pausa
var stopAudio = (e) =>{
    stopVideo();
    $('#play').removeClass('hide');
    $('#pause').addClass('hide');
    $(`#play`+ e).removeClass('hide');
    $('#pause'+ e).addClass('hide');
}










// funzione che filtra le clip in base ai parametri selezionati
var filterClips = () =>{
    //resetto la lista
    $('#listClips').html('');
    filteredList = '';
    filteredClips = [];

    //variabili che uso come contatore dell'array che memorizza valori checkbox
    var contaAud = 0;
    var contaPur = 0;
    var contaLan = 0;

    // array che memorizza valori checkbox
    checkbox_audience = [];
    checkbox_purpose = [];
    checkbox_language = [];


    var checkAudience = false;
    var checkPurpose = false;
    var checkLanguage = false;


    //inserisco valori checkbox in array
    $("input[name=audience]").each(function () {
        var ischecked = $(this).is(":checked");
        if (ischecked) {
            checkbox_audience[contaAud] = $(this).val() ;
            contaAud++

        }
    });

    $("input[name=language]").each(function () {
        var ischecked = $(this).is(":checked");
        if (ischecked) {
            checkbox_language[contaLan] = $(this).val() ;
            contaLan++

        }
    });

    $("input[name=purpose]").each(function () {
        var ischecked = $(this).is(":checked");
        if (ischecked) {
            checkbox_purpose[contaPur] = $(this).val() ;
            contaPur++

        }
    });

    range_slider = $("input[name=slider]").val();


    //creo array che memorizza le clip filtrate in base ai valori selezionati
    for (let i = 0; i < clips.length; i++) {

        checkAudience = false;
        checkPurpose = false;
        checkLanguage = false;
        for (let j=0; j < checkbox_purpose.length; j++){
            if (clips[i].purpose == checkbox_purpose[j]) {
                checkPurpose =true;
            }
        }
        for (let t=0; t < checkbox_audience.length; t++){
            if (clips[i].audience == checkbox_audience[t]) {
                checkAudience = true;
            }
        }
        for (let x=0; x < checkbox_language.length; x++){
            if (clips[i].language == checkbox_language[x]) {
                checkLanguage = true;
            }
        }

        if (checkbox_audience.length == 0) checkAudience = true;
        if (checkbox_purpose.length == 0) checkPurpose = true;
        if (checkbox_language.length == 0) checkLanguage = true;
        if (checkPurpose == true && checkAudience == true && checkLanguage == true && (clips[i].distance < range_slider || range_slider == 0 )) {
            filteredClips.push(clips[i]);
        }
    }


    //inizio a creare lista risultati
    $('#search').append('<div id="listClips" class="list-group" style="margin:5%; padding-bottom:60px"></div>');

    var b=0;

    $.each(filteredClips, function () {
        pos = '['+filteredClips[b].latlng.latitudeCenter+ ',' + filteredClips[b].latlng.longitudeCenter +']';
        filteredList += `
        <div style=" margin:1% 0px;padding: 5% auto; ">

        <div class="list-group-item list-group-item-action flex-column align-items-start bg-black color-white">
        <div class=" w-100 justify-content-between">
        <small> Purpose: <b>`+filteredClips[b].purpose +`</b> | Audience: <b>`+filteredClips[b].audience +`</b> | Language: <b>`+filteredClips[b].language +` </b>| Distanza: <b>`+parseInt(filteredClips[b].distance) +`m</b></small>

        <h2 class="mb-1">`+filteredClips[b].title +`</h2>
        </div>
        <p class="mb-1">`+filteredClips[b].description +`</p>
        <span id="play`+ filteredClips[b].videoID +`"  onclick="playAudio(\'` + filteredClips[b].videoID+ `\');">
         <ion-icon name="play-circle" style="font-size:25px;color:#FF2E55;margin-right:10px"></ion-icon>
        </span>
        <span id="pause`+ filteredClips[b].videoID +`" class="hide" onclick="stopAudio(\'` + filteredClips[b].videoID + `\');">
          <ion-icon name="pause"  style="font-size:25px;color:#FF2E55;margin-right:10px"></ion-icon>
        </span>        </div></div>`
        b++;
    });
    $('#listClips').html(filteredList);
    if (filteredList == '') $('#listClips').html('<h6 class="color-white"> Nessun risultato trovato </h6>');

};
