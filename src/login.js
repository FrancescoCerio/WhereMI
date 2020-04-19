/* Google login functions */
var googleUser; // l'utente corrente
var GoogleAuth;

var DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
var SCOPES = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl';
var isLogged = false; //Uso una variabile per controllare se l'utente ha già effettuato l'accesso
var profile;
var scriptLoaded = false;
var imageLoaded = false;

/* Variabili per i Cookie*/
var videoCookie;
var uploadedVideo;
var firstCall = false;



function initLogin() {
    gapi.load('client:auth2', clientLogin);
}


function clientLogin() {

    gapi.client.init({
        apiKey: 'AIzaSyAAjq5s_Bz-X2xC24WZlE-dWFVeUbYg6xQ',
        clientId: '971886468872-f48b7vr2fih5apam97sep6e019cv6cui.apps.googleusercontent.com',
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(async function () {
        GoogleAuth = gapi.auth2.getAuthInstance();
        // Listen for sign-in state changes.
        //GoogleAuth.isSignedIn.listen(updateSigninStatus);

        // Listen for changes to current user.
        GoogleAuth.currentUser.listen(userChanged);

        await updateSigninStatus(GoogleAuth.isSignedIn.get());


    }, function (err) {
        console.error("Error loading GAPI client for API", err);
    });
}

async function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        googleUser = GoogleAuth.currentUser.get();
        profile = googleUser.getBasicProfile();
        isLogged = true;
        startCookies();
        viewProfilo();
    } else {
        await GoogleAuth.signIn();
        googleUser = GoogleAuth.currentUser.get();
        profile = googleUser.getBasicProfile();
        isLogged = true;
        startCookies();
        viewProfilo();
    }

}

function showUser() {
    loadUserName();
    getStatistics();
    loadUserImage();
}

function loadUserName() {
    var name = profile.getName();
    $("#name").append(name);
}

function loadUserImage() {
    var image = profile.getImageUrl();
    $('.circle').css("background-image", "url(" + image + ")");
    $('#IconToRemove').remove();
    if (!imageLoaded) {
        $('#ProfileIcon').prepend('<img src="' + image + '" class="smallImageStyle"/>');
        imageLoaded = true;
    }
}

//Alcune funzioni di google
var signinChanged = function (val) {
    console.log('Signin state changed to ', val);
};

var userChanged = function (user) {
    console.log('User now: ', user);
    googleUser = user;
};

function onFailure(error) {
    console.log(error);
}

var refreshValues = function () {
    if (auth2) {
        console.log('Refreshing values...');

        googleUser = auth2.currentUser.get();
    }
}

/* Gestione Cookies per User Info */

function createCookie(key, value, date) {
    var expiration = new Date(date).toUTCString();
    var cookie = key + "=" + value + ";expires=" + expiration + ";";
    //Aggiungo il valore per il numero di video caricati impostato a 0 di default
    document.cookie = cookie;
    console.log(cookie);
    console.log("Creating new cookie with key: " + key + " value: " + value + " expiration: " + expiration);
}

function getCookie(name) {
    var key = name + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var cookies = decodedCookie.split(';');

    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf(key) === 0) {
            return cookie.substring(key.length, cookie.length);
        }
    }
    return "";
}

/* Se il cookie esiste ritorno true - false altrimenti */
function existCookie(cname) {
	var name = cname + "=";
	var decodedCookie = decodeURIComponent(document.cookie);
	var cookieArray = decodedCookie.split(';');
	var flag = false;

	//controllo tutti i cookie, se trovo il cookie cname
	for (var i = 0; i < cookieArray.length; i++) {

		var current = cookieArray[i];

		while (current.charAt(0) == ' ') {
			current = current.substring(1);
		}

		if (current.indexOf(name) == 0) {
			flag = true;
		}
	}
	console.log(flag);
	return flag;
}

/* Verifico se l'utente che ha fatto login ha già visitato in precedenza il sito */
function startCookies() {
  var currentCookie = profile.getEmail();
	if (!existCookie(currentCookie)) {
    //Creo il cookie per l'utente che non aveva effettuato il login in passato e imposto il valore per i video caricati a 0
    uploadedVideo = 0;
    createCookie(currentCookie, uploadedVideo, Date.UTC(2020, 8, 1));
	} else {
    uploadedVideo = getCookie(profile.getEmail());
  }
}

/* Da chiamare quando l'utente carica un video */
function updateCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var cookieArray = decodedCookie.split(';');

    for (var i = 0; i < cookieArray.length; i++) {

  		var current = cookieArray[i];

  		while (current.charAt(0) == ' ') {
  			current = current.substring(1);
  		}

  		if (current.indexOf(name) == 0) {
        uploadedVideo = (+getCookie(cname) || 0) + 1;
        document.cookie = cname + "=" + uploadedVideo + ";expires=" + Date.UTC(2020, 8, 1) + ";";
        getStatistics();
      }
  	}


}

/* Gestione User Info */

function getStatistics() {
  $("#loadedVideo").empty();
  $("#loadedVideo").append(uploadedVideo);
}

/* Uso una funzione per decidere se il checkbox WHY è stato selezionato */
function showDetail() {
    if ($("input[name=Why]").is(":checked")) {
        $("#dettaglio").css("display", "block");
    } else {
        $("#dettaglio").css("display", "none");
    }
}


/* FUNZIONI PER LA GESTIONE DELLA MAPPA */

// Funzione per dare classe active a voci di menu -> classe active = colore rosso.
$(document).ready(function () {
    $('.row a').on('click', function () {
        $('.row a').removeClass('active');
        $(this).addClass('active');
    })
    // initMap();
    // populateMap();
});


/* FUNZIONI PER LA GESTIONE DELLA NAVBAR */


var viewCategory = () => {
    $("#nearMe,#media, #search, #point").empty();
    $('#nearMe, #media, #search, #mapid, #point, #controls').fadeOut(100);
    $('#category').load("categorie.html .first-div").fadeIn(0);
    $('#btnNearMe').attr('onClick', 'viewNearMe();');

}
var viewMap = () => {

    $("#category, #nearMe, #media, #search, #point").empty();
    map.invalidateSize();
    $("#category, #nearMe, #media, #search, #point").css("display", "none");
    map.invalidateSize();
    $("#mapid, #controls, .dimension").fadeIn();
    map.invalidateSize();
    $('#btnNearMe').attr('onClick', 'viewNearMe();');
    map.invalidateSize();
}
var viewNearMe = () => {
    $("#category, #media, #search, #point").empty();
    $('#category, #media, #search, #mapid, #point, #controls').fadeOut(100);
    $('#nearMe').fadeIn();
    $("#nearMe").append(clipListHTML);
    $("#btnNearMe").prop("onclick", null);

}

/*
 * Verifico se l'utente ha già effettuato l'accesso
 * In caso affermativo carico direttamente l'Editor
 * In caso negativo carico la schermata di login
 */
var viewProfilo = async () =>  {
    $("#category, #nearMe, #search, #point").empty();
    $('#category, #nearMe, #search, #mapid, #point, #controls').fadeOut(100);
    $('#btnNearMe').attr('onClick', 'viewNearMe();');


    /* Funzione per aggiungere lo script Google per caricare il pulsante di login */
    if (!scriptLoaded) {
        $(function () {
          $('head').append('<script defer src="https://apis.google.com/js/api.js" onload="this.onload=function(){};initLogin();" onreadystatechange="if(this.readyState === "complete") this.onload()"></script>');
            scriptLoaded = true;
        });
    }



    if (!isLogged) {
        $('#media').load("profilo.html #loginCheck").fadeIn(0);


    } else {
        $('#media').load("profilo.html #loadProfilo", await showUser).fadeIn(0);
                $('body').append('<script defer src="./editor.js" type="text/javascript"></script>');
                $('body').append('<script defer src="./cors_upload.js" type="text/javascript"></script>');
                $('body').append('<script defer src="./uploadVideo.js" type="text/javascript"></script>');

        }
    }



var viewSearch = () => {
    $("#category, #nearMe, #media, #point").empty();
    $('#category, #nearMe, #media, #mapid, #point, #controls').fadeOut(100);
    $('#search').load("cerca.html .first-div").fadeIn(0);
    $('#btnNearMe').attr('onClick', 'viewNearMe();');

}

var viewPoint = () => {
    $("#category, #nearMe, #media, #search").empty();
    $('#category, #nearMe, #media, #mapid, #controls, .dimension').fadeOut(100);
    $('#point').fadeIn(0);
    $('#btnNearMe').attr('onClick', 'viewNearMe();');

}

$(document).ready(function () {
    $("#myBtn").click(function () {
        $("#exampleModal").modal();
    });
});

function selectOnlyThis(id) {
    if (($("input[name=What]").is(":checked")) || ($("input[name=How]").is(":checked"))) {
        $("#dettaglio").css("display", "none");
    }

    for (var i = 1; i <= 3; i++) {
        document.getElementById("Check" + i).checked = false;
    }
    document.getElementById(id).checked = true;
}


function signOut() {
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    console.log('User signed out.');
    isLogged = false;
    viewProfilo();
    removeUser();
  });
}


function removeUser() {
    $('.smallImageStyle').remove();
    $('#ProfileIcon').prepend('<ion-icon id="IconToRemove" name="ios-contact" size="large"></ion-icon>');
    imageLoaded = false;
}

function salvo() {
    var storeLingua = document.getElementById("formLanguage").value;
    var storeCategoria = document.getElementById("formCategory").value;
    var storePubblico = document.getElementById("formPublic").value;

    localStorage.setItem("lingua", storeLingua);
    localStorage.setItem("categoria", storeCategoria);
    localStorage.setItem("pubblico", storePubblico);
}
