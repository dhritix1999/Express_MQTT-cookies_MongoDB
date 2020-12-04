
var client = new Paho.MQTT.Client('localhost', 9001, '', parseInt(Math.random() * 100, 10)+'');

var remember;
var email, username;
var startCord, endCord;

function getResponse(){


    $.get('/session_info', function(data){
            email = data.email;
            username = data.username
           remember = data.remember;


            console.log("email"+email+"username"+data.remember);

            $("#usernameText").append(username);

            console.log("cookies allowed");


            if (data.last_time != "") {
                date = new Date(data.last_time);
                str = "Welcome back " + data.username + "! You last visited on: " + date.toString();
                $("#welcome").text(str);
            }
    });


 
}




window.onload = function () {

  
    getResponse();
    init();

    var map;

    map = L.map('mapid', {
        layers: MQ.mapLayer(),
        zoom: 20
    });
    map.locate({ setView: true, watch: true, maxZoom: 20 });

    var layerGroup = L.layerGroup().addTo(map)
    var myLayer = null;
    var counter = 0;
    var startLat = null; startLng = null; endLat = null; endLng = null;


    function onLocationFound(e) {
        var radius = e.accuracy / 2;

        startLat = e.latlng.lat;
        startLng = e.latlng.lng;
        console.log(startLat, startLng);

        if (endLat != null && endLng != null) {
            startRoute();
        }
        else {
            L.marker(e.latlng).addTo(layerGroup).bindPopup("You are within " + radius + " meters from this point").openPopup();

            L.circle(e.latlng, 100).addTo(layerGroup);
        }
    }
    map.on('locationfound', onLocationFound);



    function onMapClick(e) {
        //only for one click
        if (counter == 0) {

            //set the cordinates
            endLat = e.latlng.lat;
            endLng = e.latlng.lng;
            console.log(counter);
            counter++;
            console.log(endLat, endLng);
            startRoute();
        }

    }

    map.on('click', onMapClick);

    function startRoute() {

        if (startLat != null && startLng != null && endLat != null && endLng != null) {
            if (myLayer != null && map.hasLayer(myLayer)) {
                map.removeLayer(myLayer);
            }

            var dir = MQ.routing.directions();

            var locations = [{ latLng: { lat: startLat, lng: startLng } },
            { latLng: { lat: endLat, lng: endLng } }];


            dir.route({ locations });

            layerGroup.clearLayers();

            myLayer = MQ.routing.routeLayer({
                directions: dir,
                fitBounds: true,
                draggable: false
            });
            map.addLayer(myLayer);

            console.log(locations);
            

            startCord = {lat: startLat, lng: startLng}
            endCord = {lat: endLat, lng: endLng}

            message = new Paho.MQTT.Message(JSON.stringify({
                email: email,
                current: startCord,
                destination: endCord,
            }));
            message.destinationName = "location";
            client.send(message);


        }
    }


}



//mqtt
var options = {
    timeout: 3,
    onSuccess: function () {
        console.log("mqtt connected");

    },
    onFailure: function (message) {
        console.log("Connection failed: " + message.errorMessage);
    }
};

function init() {
    client.connect(options);    
}










