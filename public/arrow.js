var client = new Paho.MQTT.Client('localhost', 9001, '', parseInt(Math.random() * 100, 10)+"");
var email, remember;



function getResponse(){
    $.get('/session_info', function(data){
    
            email = data.email;
            remember = data.remember;
    });
}


// called when the client loses its connection
client.onConnectionLost = function(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("onConnectionLost:" + responseObject.errorMessage);
    }
}

// called when a message arrives
client.onMessageArrived = function(message) {

    if(message.destinationName == 'location'){
        var coords = JSON.parse(message.payloadString);

        console.log(coords.current);

        var startLat = coords.current.lat;
        var startLng = coords.current.lng;
        var endLat = coords.destination.lat;
        var endLng = coords.destination.lng;

        var x = endLat - startLat;
        var y = endLng - startLng;

        var degree = Math.atan2(y,x) * (180 / Math.PI);
        console.log(degree);
        // if(degree<0){
        //     degree = degree+180;
        //     console.log(degree);
        // }
        $('.rotated').css('transform', 'rotate('+0+'deg');
        $('.rotated').css('transform', 'rotate('+degree+'deg');
    }
    
    console.log("onMessageArrived:" + message);
};



var options = {
    timeout: 3,
    onSuccess: function () {
        console.log("mqtt connected");
        client.subscribe("location", { qos: 2 });
    },
    onFailure: function (message) {
        console.log("Connection failed: " + message.errorMessage);
    }
};

function init() {
    client.connect(options);
    getResponse();
}

