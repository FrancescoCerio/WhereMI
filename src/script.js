// Funzione per dare classe active a voci di menu -> classe active = colore rosso.
$(document).ready(function() {
    $('.row a').on('click', function() {
        $('.row a').removeClass('active');
        $(this).addClass('active');
    })
});

//Gestione della Mappa
$('#mapid').empty()
// Prendo posizione : latitudine e longitudine
navigator.geolocation.getCurrentPosition(function(location) {
    var latlng = new L.LatLng(location.coords.latitude, location.coords.longitude);
    var lat = location.coords.latitude;
    var long = location.coords.longitude;
    // Setto la mappa
    var mymap = L.map('mapid', {
        center: latlng,
        zoom: 14,
        attributionControl: false,
        zoomControl: false
    });

    // Controlli per lo zoom separati dalla mappa
    L.control.zoom({
        position:'topleft',
    }).addTo(mymap);

    //  console.log(latlng);
    L.tileLayer('https://api.mapbox.com/styles/v1/mattiaceluno/ck263uc6k08xu1cpiog49klp4/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibWF0dGlhY2VsdW5vIiwiYSI6ImNrMjYxb3Z1bjE5Y2IzY21xZW1laTZjdHcifQ.-tO_ahzF55IoOpnPtMH0VQ', {
        attribution: '',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'your.mapbox.access.token',
    }).addTo(mymap);
    // Metto marker su posizione attuale
    var marker = L.marker(latlng).addTo(mymap);



    // Prova Poligono
    // var zonaUniversità = {
    //   "type": "Feature",
    //   "properties": {},
    //   "geometry": {
    //     "type": "Polygon",
    //     "coordinates": [
    //       [
    //         [
    //           11.354198455810547,
    //           44.498739907567064
    //         ],
    //         [
    //           11.353490352630615,
    //           44.497086941433054
    //         ],
    //         [
    //           11.356258392333984,
    //           44.49626044079391
    //         ],
    //         [
    //           11.356086730957031,
    //           44.49811239816374
    //         ],
    //         [
    //           11.354198455810547,
    //           44.498739907567064
    //         ]
    //       ]
    //     ]
    //   }
    // };
    // L.geoJSON(zonaUniversità, {
    //   pointToLayer: function(feature, latlng) {
    //     return L.circleMarker(latlng);
    //   }
    // }).addTo(mymap);


    //definisco punti d'interesse
    var pointOfInterest = {
        "type": "FeatureCollection",
        "features": [{
                "type": "Feature",
                "properties": {
                    "Id": "1",
                    "color": "#FF2E55",
                    "Nome": "Università",
                    "img": "images/universita.jpg",
                    "desc": "L'Alma Mater Studiorum – Università di Bologna, a volte indicata come Unibo, è un'università italiana statale, la più antica del mondo. Nonostante le prime edizioni note di statuti universitari risalgano al 1317, una fiorente scuola giuridica esisteva già dall'XI secolo."

                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        11.354241371154785,
                        44.49981124947734
                    ]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "Id": "2",
                    "color": "#67DA6C",
                    "Nome": "Montagnola",
                    "img": "images/montagnola.jpg",
                    "desc": "Il giardino della Montagnola è una delle più antiche e centrali aree verdi della città di Bologna, aperto per la prima volta nel XVII secolo."

                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        11.346344947814941,
                        44.502412997875574
                    ]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "Id": "3",
                    "color": "#67DA6C",
                    "Nome": "Piazza Maggiore",
                    "img": "images/piazza-maggiore.jpg",
                    "desc": "Piazza Maggiore è la piazza principale di Bologna,\n misura 115 metri in lunghezza e 60 metri in larghezza,\n ed è circondata dai più importanti edifici \n della città medievale."
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        11.342911720275879,
                        44.49368903055563
                    ]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "Id": "4",
                    "color": "#675FFF",
                    "Nome": "Stazione Centrale",
                    "img": "images/stazione.jpg",
                    "desc": "La stazione di Bologna Centrale è la principale stazione ferroviaria della città di Bologna e, a maggio 2015, la quinta in Italia per dimensioni e volume di traffico viaggiatori (circa 78 000 m² attraversati da 58 000 000 di viaggiatori all'anno), dopo Roma Termini, Milano Centrale, Torino Porta Nuova e Firenze Santa Maria Novella. Nel 2013 sono stati attivati 4 binari dedicati all'Alta Velocità nella nuova stazione sotterranea."
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        11.342139244079588,
                        44.50556554917157
                    ]
                }
            },
        ]
    };


    // Route vuoto
    route = L.Routing.control({
        waypoints: []
    })

    var getRoute = (features) => {
        // Cancello il controllo route vecchio
        mymap.removeControl(route);

        options = {profile:'mapbox/walking',language:'it'}
        route = L.Routing.control({
            waypoints: [
                L.latLng(latlng),
                L.latLng(features.geometry.coordinates[1], features.geometry.coordinates[0])
            ],
             router: new L.Routing.mapbox('pk.eyJ1IjoibWF0dGlhY2VsdW5vIiwiYSI6ImNrMjYxb3Z1bjE5Y2IzY21xZW1laTZjdHcifQ.-tO_ahzF55IoOpnPtMH0VQ', options),
            lineOptions: {
                styles: [{
                    color: '#FF2E55'
                }]
            },
            routeWhileDragging: false,
            autoRoute: true,

        }).addTo(mymap);
    }



    // Funzione per riempire Div con id Point : è il div che gestisce la pagina dei punti d'interesse
    var riempiDiv = (features) => {

        // Qui creo l'html
        var myPoint = `
<div class="closePoint" style="position:fixed;  font-size:25px; top:10px; right:10px; "><a href="#" style="color:#fff; text-decoration:none;" onclick="viewMap()">
<ion-icon ios="ios-close-circle" md="md-close-circle" style="color:#FF2E55!important"></ion-icon>
</a>
</div>
<header style="
height: 100vh;
min-height: 500px;
background-image: url('` + features.properties.img + `');
background-size: cover;
background-position: center;
background-repeat: no-repeat;">
<div class="container h-100">
<div class="row h-100 align-items-center">
<div class="col-12 text-center">
<h1 style="font-size:70px; color:#fff;">` + features.properties.Nome + `</h1>

</div>
</div>
</div>
</header>

<!-- Page Content -->
<section class="py-5">
<div class="container">
<h2 style="color:#fff;">Descrizione</h2>
<p class="lead" style="color:#fff"> ` + features.properties.desc + `</p>
<br>
<a href="#" style="text-decoration:none; color:#FF2E55; font-size:20px;" class="indicazioni">
Ottieni indicazioni
</a>
</div>

</section>
`

        // Sostituisco l'html con quello creato
        $("#point").html(myPoint);

    }

    // Per ogni punto d'interesse, al click, comparirà la scheda tecnica
    geojson = L.geoJson(pointOfInterest, {
        style: function(feature) {
            return {
                color: feature.properties.color
            };
        },

        pointToLayer: function(feature, latlng) {
            return new L.CircleMarker(latlng, {
                radius: 10,
                fillOpacity: 0.85
            });
        },

        onEachFeature: function onEachFeature(feature, layer) {
            layer.on('click', function(e) {
                riempiDiv(feature);
                viewPoint();

                // Cliccando su ottieni indicazioni, ti da le indicazioni e torna sulla mappa
                $(".indicazioni").on("click", e => {
                    viewMap();
                    getRoute(feature);
                });


            });
        }
    })
    mymap.addLayer(geojson);
    //.addTo(mymap);
});
var viewCategory = () => {
    $("#nearMe, #media, #search, #point").empty();
    $('#nearMe, #media, #search, #mapid, #point').fadeOut(100);
    $('#category').load("categorie.html #first-div").fadeIn(0);
}
var viewMap = () => {
    $("#category, #nearMe, #media, #search, #point").empty();
    $("#category, #nearMe, #media, #search, #point").css("display", "none");
    $("#mapid").fadeIn();
}
var viewNearMe = () => {
    $("#category, #media, #search, #point").empty();
    $('#category, #media, #search, #mapid, #point').fadeOut(100);
    $('#nearMe').load("nearme.html #first-div").fadeIn(0);
}
var viewProfilo = () => {
    $("#category, #nearMe, #search, #point").empty();
    $('#category, #nearMe, #search, #mapid, #point').fadeOut(100);
    $('#media').load("profilo.html #first-div").fadeIn(0);
}
var viewSearch = () => {
    $("#category, #nearMe, #media, #point").empty();
    $('#category, #nearMe, #media, #mapid, #point').fadeOut(100);
    $('#search').load("cerca.html #first-div").fadeIn(0);
}

var viewPoint = () => {
    $("#category, #nearMe, #media, #search").empty();
    $('#category, #nearMe, #media, #mapid').fadeOut(100);
    $('#point').fadeIn();
}


//GOOGLE LOGIN
/*
window.onLoadCallback = function(){
  gapi.auth2.init({
        client_id: '56234407648-spkh4mn29hh7dl7vf2rrnrbvfstqr8ps.apps.googleusercontent.com'
      });
}
*/
