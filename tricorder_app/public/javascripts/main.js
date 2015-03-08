/**
 * Created by Manas on 07-03-2015.
 */


var LocationFetcher = function () {
    function getCurrenPosition(successCallback) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(successCallback, _failureCallback);
        }
        else {
            console.log("Geolocation is not supported by this browser");
        }
    }

    function _failureCallback(error) {
        var error_message = null;
        switch(error.code) {
            case error.PERMISSION_DENIED:
                error_message = "User denied the request for Geolocation.";
                break;
            case error.POSITION_UNAVAILABLE:
                error_message = "Location information is unavailable.";
                break;
            case error.TIMEOUT:
                error_message = "The request to get user location timed out.";
                break;
        }
        console.log(error_message);
    }

    return {
        getCurrentPosition: getCurrenPosition
    };
}();

var NearbyStops = function () {
    function init() {
        if (window.location.href.indexOf("?lat=") == -1)  {
            // append user's current location to url and reload
            LocationFetcher.getCurrentPosition(function (position) {
                window.location.href = "/nearby-stops?lat=" + position.coords.latitude + "&lng=" + position.coords.longitude;
            });
        }
        _bindUIActions();
    }

    function _bindUIActions() {
    }

    return {
        init: init
    };
}();


// function calls go here
$(document).ready(function () {
    // only initialize the modules required for the current page
    if (window.location.href.indexOf('/nearby-stops') > -1) {
        NearbyStops.init();
    }
});
