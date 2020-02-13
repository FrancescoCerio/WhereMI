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

    iconSize:     [25, 25], // size of the icon
});

// Route vuoto
route = L.Routing.control({
    waypoints: []
})

// Marker posizione attuale
var myPositionMarker;

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

var initMap = () => {
    $('#mapid').empty()
    // Setto la mappa
    map = L.map('mapid', {
        center: [44.5075, 11.35],
        zoom: 14,
        attributionControl: false,
        zoomControl: false
    });

    L.tileLayer('https://api.mapbox.com/styles/v1/mattiaceluno/ck263uc6k08xu1cpiog49klp4/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibWF0dGlhY2VsdW5vIiwiYSI6ImNrMjYxb3Z1bjE5Y2IzY21xZW1laTZjdHcifQ.-tO_ahzF55IoOpnPtMH0VQ', {
        attribution: '',
        maxZoom: 18,
        id: 'mapbox.streets',
    }).addTo(map);

    // Controlli per lo zoom
    zoomButton = L.control.zoom({
        position: 'topright',
    }).addTo(map);


    // Reimposta mappa sulla posizione attuale
    currentPositionButton.addTo(map);

    // Metto marker posizione
    myPositionMarker = new L.Marker([0,0], {
        draggable: true,
        autoPan: true,
        icon: io,


    }).addTo(map);


    var location = new L.circleMarker();

   //Sposto il marker della mia posizione ed escono nuove clips
    myPositionMarker.on('moveend', function (e) {
        distances = [];
        clipListHTML = '';
        latlng = myPositionMarker.getLatLng();

        map.removeLayer(location);
        location = new L.circleMarker(latlng, {radius:100,});
        map.addLayer(location);

        lat = latlng[0];
        lng = latlng[1];
        searchClips();
        count = {val: 0};
    });


    // Impostazione della mappa
    if (navigator.geolocation){
        navigator.geolocation.getCurrentPosition(function (location) {
            // Geolocalizzazione attiva
            console.log("Geolocalizzazione attiva");
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
            console.log("Geolocalizzazione non attiva");
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





var searchClips = () => {
    j=0;
    i=0;
    // Ottengo Plus Code da lat e lng
    var markerLat = myPositionMarker.getLatLng().lat;
    var markerLng = myPositionMarker.getLatLng().lng;

    var query = OpenLocationCode.encode(markerLat,markerLng, 6);
    // Chiave YouTube
    var apikey = "AIzaSyANz35j1DLXzxpDO_q631hG4cFUn8vxcKA";
     // Limite al numero dei risultati
	var maxResults = 30;
	request = "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + query + "&key=" + apikey + "&maxResults=" + maxResults;

    /* Estendo la classe CircleMarker per poter salvare info extra sul luogo */
    ourMarker = L.CircleMarker.extend({
        options: {
            name: 'Clip title',
            description: 'Description data!',
            content: 'Content data',
            audience: 'Audience data',
            purpose: 'Purpose data',
            language: 'Language data',
            videoId: 'Youtube Video ID'
        }
    });

	$.getJSON(request, function (resObj) {
		var clipList = resObj.items;
        // Controllo ogni risultato della ricerca per capire se è una clip
		$.each(clipList, function (index) {
            // Ottengo Titolo e ID del video
            var title = clipList[index].snippet.title;
            var titleFinal = title.split(":")[0];
            // Per pulire titoli delle clip
            if (titleFinal.includes("#")) titleFinal = titleFinal.split("#")[0];
            if (titleFinal.includes("-")) titleFinal = titleFinal.split("-")[0];
            if (/([23456789C][23456789CFGHJMPQRV][23456789CFGHJMPQRVWX].*$)/.test( titleFinal )) {
                console.log(" Plus code nel titolo della clip: "+ titleFinal + " rifiutato");
                return true;
            };


            // YouTube Video ID
            var clipID = clipList[index].id.videoId;

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
            // Controllo per assicurarmi che la clip contenga un olc ben formato
            if ( ! /([23456789C][23456789CFGHJMPQRV][23456789CFGHJMPQRVWX]{4}00\+)\-([23456789C][23456789CFGHJMPQRV][23456789CFGHJMPQRVWX]{6}\+)\-([23456789C][23456789CFGHJMPQRV][23456789CFGHJMPQRVWX]{6}\+[23456789CFGHJMPQRVWX]{2,3})/.test( olcSplit ) ) {
                console.log("Rifiutata clip:" + clipTitle + " - olc: " + olc);
                return;
            }
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
			var clipPosition = OpenLocationCode.decode(olcFinal);

            // Purpose clip
			var purpose = clipList[index].snippet.description;
			var purposeRaw = purpose.split(":")[1];
			var purposesList = {what:"Che cosa", how:"Come", why:"Perché"};
			var purposeFinal = purposesList[purposeRaw];

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
                case "deu":
                    languageFinal = "Deutsch";
                case "esp":
                    languageFinal = "Espanol";
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
			}

			if (typeof detailFinal === "undefined") detailFinal = detailsList[0];
            if (typeof descriptionFinal === "undefined") descriptionFinal = "Descrizione non disponibile.";

            var showMarker = (e) =>{
                viewDetail(pos, clipID, titleFinal, purposeFinal, contentFinal, languageFinal, audienceFinal, descriptionFinal,detailFinal);
            }
            marker = new ourMarker([clipPosition.latitudeCenter, clipPosition.longitudeCenter], {
                radius: 7,
                fillOpacity: 0.20,
                color: 'white',
                // Clip Info
                name: titleFinal,
                description: descriptionFinal,
                content: contentFinal,
                audience: audienceFinal,
                purpose: purposeFinal,
                language: languageFinal,
                videoId: clipID,
                latlng: clipPosition
            }).addTo(map).on('click', e => {
              bool = {val:0};
              showMarker();
            });


            //variabile posizione di ogni clip, formato stringa
            pos = '['+clipPosition.latitudeCenter+','+clipPosition.longitudeCenter+']';
            //creo array che mi da la distanza dai vari punti
            distances[j] = {distance: getDistance(latlng,clipPosition), latlng:clipPosition, clip: clipID, title: titleFinal, purpose: purposeFinal, language: languageFinal, audience: audienceFinal, content: contentFinal, description:descriptionFinal};
            j++;



            //Popup on hover con pulsanti indicazioni e dettagli
            marker.on('mouseover', function(e) {
                pos = e.latlng;
                //open popup;
                var popup = L.popup()
                .setLatLng(e.latlng)
                .setContent(`<div class="container" style="width:300px;"><div class="row"> <b> Distanza: </b> `+parseInt(getDistance(latlng, clipPosition))+`m</div><div class="row"><h1 style="font-size:20px; color:#000;"> ` +e.target.options.name+ `</h1></div><div class="row"><div class="col-4"><a href="#" class="indicazioni">Indicazioni </a></div> <div class="col-4"><a href="#" class="dettagli"> Vedi dettagli </a> </div> </div></div>`)
                .openOn(map)

                $(".indicazioni").on("click", n => {
                    viewMap();
                    getRoute(pos);
                });
                $(".dettagli").on("click", n  => {
                    bool = {val:0};
                    viewDetail(pos, clipID, titleFinal, purposeFinal, contentFinal, languageFinal, audienceFinal, descriptionFinal,detailFinal);
                });
                $(".audio").on("click", n  => {
                  playAudio(clipID);
                });
            });



            var populateNearMe = (e) => {
                // Per evitare di ricontrollare tutta la lista dei video trovati dopo,
                // per ogni clip trovata creo una card da caricare nella pagina nearMe.
                imgwiki = {img:''}
                searchImgWiki(titleFinal);

                clipCard = `<div class="col-12 col-sm-6 space col-md-4 col-lg-4 col-xl-4" >
                            <div id="cardID" class="card cardcontainer" style="background-color:#555 ;background-image:url(` + imgwiki.img +  `); background-size:cover">
                            <div class="overlay">
                            <div class="card-body">
                            <h5 class="card-title color-white ">` + titleFinal + `</h5>
                            <h6 class="card-subtitle mb-2 color-white">` + languageFinal + `</h6>
                            <p class="card-text color-white">Distanza: <b>` + parseInt(getDistance(latlng, clipPosition)) + `m</b></p>
                            <p class="card-text color-white">Audiance: <b>` + audienceFinal + `</b></p>
                            <p class="card-text color-white">Purpose: <b>` + purposeFinal + `</b></p>
                            <span id="play`+ clipID +`"  onclick="playAudio(\'` + clipID+ `\');">
                              <ion-icon name="play-circle" style="font-size:25px;color:#fff;margin-right:10px"></ion-icon>
                            </span>
                            <span id="pause`+ clipID +`" class="hide" onclick="stopAudio(\'` + clipID+ `\');">
                              <ion-icon name="pause"  style="font-size:25px;color:#fff;margin-right:10px"></ion-icon>
                            </span>
                            <a href="#"  onclick="fromCard(); viewDetail(\'`+e +'\',\'' + clipID+ '\',\'' + titleFinal + '\',\'' + purposeFinal+ '\',\'' +contentFinal+ '\',\'' +languageFinal+ '\',\'' + audienceFinal+ '\',\'' + descriptionFinal+'\',\'' + detailFinal+`\')" class="dettagli card-link">Dettagli</a>
                            <a href="#" onclick="viewMap(); getRoute(`+ e +`)" class="card-link indicazioni">Indicazioni</a>
                            </div></div></div></div>
                        `;
                // Aggiungo la card alle altre
                clipListHTML += clipCard;


              }

            //faccio colonne da 3
            if (i==0){
              clipListHTML += '<div class="row" style="margin: 2% 2% 2% 2%">'
            }

            //popolo NearMe
            populateNearMe(pos);

            i++;


            if (i==3) {
              clipListHTML += '</div>'
              i=0;
            }


        });
        ordinaArray(distances);

    });

}
var imgwiki = {img:''};

// Funzione che visualizza la pagina di dettaglio dei vari punti d'interesse
var viewDetail = (pos, clipID, titleFinal, purposeFinal, contentFinal, languageFinal, audienceFinal, descriptionFinal, detailFinal) => {
    imgwiki = {img:''}
    searchImgWiki(titleFinal);

    // Link al video della clip
    var youtube = `https://www.youtube.com/embed/`+ clipID;
    // var img = searchImg(titleFinal);

    var myPoint = `
      <div class="closePoint" style="position:fixed;  font-size:25px; top:10px; right:10px; "><a href="#" style="color:#fff; text-decoration:none;" onclick="viewMap();viewMap();"><ion-icon ios="ios-close-circle" md="md-close-circle" style="color:#FF2E55!important"></ion-icon></a></div>
      <header id="imgHead" style="height: 20vh;min-height: 500px; background-size: cover;background-position: center;background-repeat: no-repeat;">
      <div class="container h-100"><div class="row h-100 align-items-center"><div class="col-12 text-center">
      <h1 style="font-size:70px; color:#fff;">` + titleFinal + `</h1>
      <p class="lead" style="color:#fff;font-size:20px;"> ` + descriptionFinal + `</p>
      <p class="lead" style="color:#fff"font-size:10px>  <b>` + languageFinal + `</b></p>
      </div></div></div></header>
      <!-- Page Content -->
      <section class="py-5">
      <div class="container">
      `+`
      <h2 style="color:#fff;"> Informazioni Clip </h2>
      <p class="lead" style="color:#fff;font-size;"> <b> Description: </b>` + descriptionFinal + `</p>
      <p class="lead" style="color:#fff"> <b> Content: </b>` + contentFinal + `</p>
      <p class="lead" style="color:#fff"> <b> Purpose: </b>` + purposeFinal + `</p>
      <p class="lead" style="color:#fff"> <b> Audiance: </b>` + audienceFinal + `</p>
      <p class="lead" style="color:#fff"> <b> Detail: </b>` + detailFinal + `</p>
      <a href="#" style="text-decoration:none; color:#FF2E55; font-size:20px;" class="readDescription"> <ion-icon name="mic"></ion-icon> Ascolta descrizione <br><br></a>
      <a href="#" style="text-decoration:none; color:#FF2E55; font-size:20px;" class="searchWiki"> <ion-icon name="book"></ion-icon> Cerca su Wikipedia <br><br></a>
      <a href="#" style="text-decoration:none; color:#FF2E55; font-size:20px;" class="playClipButton"> <ion-icon name="play"></ion-icon> Riproduci Clip <br><br></a>
      <a href="#" style="text-decoration:none; color:#FF2E55; font-size:20px;" class="indicazioni"> <ion-icon name="navigate"></ion-icon> Ottieni indicazioni</a>
      </div></section>`;

    $("#point").html(myPoint);
    $('#imgHead').css('background-image', `url("` + imgwiki.img +  `")`);
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
    $(".readDescription").on("click", e => {
        var msg = new SpeechSynthesisUtterance(descriptionFinal);
        window.speechSynthesis.speak(msg);
    });
    $(".searchWiki").on("click", e => {
        searchDescWiki(titleFinal);
    });

    viewPoint();
};

//ritorna distanza in metri da due punti
var getDistance=(origin, destination)=> {
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



// per vedere se ottieni indicazioni proviene dalla card in NearMe (serve per fare un cast della posizione)
var fromCard =()=>{
    bool = {val:1};
}


// funzione che riproduce la prima clip sul luogo corrente
var playNearMe = (count) => {
    var posizione = [];
    playAudio(distances[count.val].clip);
    $('.infoTitle').html(distances[count.val].title);
    $('.infoDistance').html('<b> Distanza </b>' + parseInt(distances[count.val].distance) +'m');
    $('.infoPurpose').html('<b> Purpose </b>' + distances[count.val].purpose);
    posizione[count.val] =  '[' + distances[count.val].latlng.latitudeCenter +','+ distances[count.val].latlng.longitudeCenter +']';
    $('.infoIndicazioni').html(`<a style="color:#FF2E55; font-weight:600;" onclick="getRoute(`+posizione[count.val]+` )"> Raggiungi location </a>`);
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


//incrementa
var incr = (count) => {
    count.val++;
}
//decrementa
var decr = (count) => {
    count.val--;
}


var searchDescWiki = (name) => {
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
        "error":function() { console.log(" Pagina Wikipedia " + name  +" non trovata");  }
    });
    $.getJSON("https://it.wikipedia.org/api/rest_v1/page/summary/" + name , function (data) {
        str = JSON.stringify (data);
        if (str.includes("not_found") || str == "")
            alert(" Pagina wikipedia non trovata");
        else {
          alert(data["extract"])
}
    });
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
        async: false,
        "error":function() { console.log(" Pagina Wikipedia " + name  +" non trovata");  }
    });

    $.getJSON("https://it.wikipedia.org/api/rest_v1/page/summary/" + name , function (data) {
        str = JSON.stringify (data);
        if (str.includes("not_found") || str == "")
            alert(" Pagina wikipedia non trovata");
        else {
            imgwiki.img = data.originalimage.source;
        }
    });
}
// Ricerca di immagini per punti di interesse
var searchImg = (name) => {
    var res;
    var found = false;

    function searchImgLocal(query){
        $.ajax({
            url:'/images/'+ query + '.jpeg',
            type:'HEAD',
            async: false,
            error: function(){
                found = false;
                console.log("No img for " + query);
            },
            success: function(){
                // Local version
                found = true;
                res = `background-image: url('/images/` + query + `.jpeg');`;
            }
        });
    }
    // Formato nomi in locale:
    // No spazi, tutte lettere minuscole
    // es. "palazzopepoli"
    local = name.replace(/ /g,"");
    local = local.toLowerCase();
    searchImgLocal(local);

    if (found)
        return res;
    else return "";
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
    for (let i = 0; i < distances.length; i++) {
       checkAudience = false;
       checkPurpose = false;
       checkLanguage = false;
      for (let j=0; j < checkbox_purpose.length; j++){
        if (distances[i].purpose == checkbox_purpose[j]) {
            checkPurpose =true;
        }
      }
      for (let t=0; t < checkbox_audience.length; t++){
        if (distances[i].audience == checkbox_audience[t]) {
            checkAudience = true;
        }
      }
      for (let x=0; x < checkbox_language.length; x++){
        if (distances[i].language == checkbox_language[x]) {
            checkLanguage = true;
        }
      }

      if (checkbox_audience.length == 0) checkAudience = true;
      if (checkbox_purpose.length == 0) checkPurpose = true;
      if (checkbox_language.length == 0) checkLanguage = true;
      if (checkPurpose == true && checkAudience == true && checkLanguage == true && (distances[i].distance < range_slider || range_slider == 0 )) {
        filteredClips.push(distances[i]);
      }
    }


    //inizio a creare lista risultati
    $('#search').append('<div id="listClips" class="list-group" style="margin:5%;"></div>');

    var b=0;

    $.each(filteredClips, function () {
      pos = '['+filteredClips[b].latlng.latitudeCenter+ ',' + filteredClips[b].latlng.longitudeCenter +']';
      filteredList += `
      <div style=" margin:1% 0px;padding: 5% auto; "

      <a href="#" onclick="fromCard();viewDetail(\'`+ pos +'\',\'' + filteredClips[b].clip+ '\',\'' + filteredClips[b].title + '\',\'' + filteredClips[b].purpose+ '\',\'' +filteredClips[b].content+ '\',\'' +filteredClips[b].language+ '\',\'' + filteredClips[b].audience+ '\',\'' + filteredClips[b].description+'\',\'' + filteredClips[b].detail+`\')" class="list-group-item list-group-item-action flex-column align-items-start bg-black color-white">
          <div class=" w-100 justify-content-between">
          <small> Purpose: <b>`+filteredClips[b].purpose +`</b> | Audience: <b>`+filteredClips[b].audience +`</b> | Language: <b>`+filteredClips[b].language +` </b>| Distanza: <b>`+parseInt(filteredClips[b].distance) +`m</b></small>

            <h2 class="mb-1">`+filteredClips[b].title +`</h2>
          </div>
          <p class="mb-1">`+filteredClips[b].description +`</p>
          <small style="color:#FF2E55">Clicca per dettagli</small>
        </a></div>`
b++;
});
      $('#listClips').html(filteredList);
      if (filteredList == '') $('#listClips').html('<h6 class="color-white"> Nessun risultato trovato </h6>');

};
