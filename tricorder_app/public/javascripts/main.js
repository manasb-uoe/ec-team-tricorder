/**
 * Created by Manas on 07-03-2015.
 */


var LocationFetcher = function () {
    function getCurrenPosition(successCallback) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(successCallback, failureCallback);
        }
        else {
            console.log("Geolocation is not supported by this browser");
        }
    }

    function failureCallback(error) {
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
    var config = {
        changeFilterButton: $("#change-filter-button"),
        countSelected: $("#count-selected"),
        filterModal: $("#filter-modal"),
        filterModalBody: $("#filter-modal-body"),
        filterModalCountSelect: $("#filter-modal-count-select"),
        filterModalPositiveButton: $("#filter-modal-positive-button")
    };

    function init() {
        var params = getParamsFromUrl();
        if (params["lat"] == null || params["lng"] == null) {
            // append user's current location to url and reload
            LocationFetcher.getCurrentPosition(function (position) {
                window.location.href = "/nearby-stops?lat=" + position.coords.latitude + "&lng=" + position.coords.longitude;
            });
        }
        bindUIActions();
    }

    function bindUIActions() {
        config.changeFilterButton.click(function () {
            showFilterModal();
        });

        config.filterModalPositiveButton.click(function () {
            var params = getParamsFromUrl();
            params["count"] = config.filterModalCountSelect.val();
            window.location.href = generateUrl(params);
        });
    }

    function showFilterModal() {
        config.filterModalCountSelect.find("option[value='" + config.countSelected.text() + "']").attr("selected", true);
        config.filterModal.modal();
    }

    function getParamsFromUrl() {
        var params = window.location.search.substr(1).split('&');
        var lat = null;
        var lng = null;
        var count = null;
        for (var i=0; i < params.length; i++) {
            if (params[i].indexOf('lat') > -1) {
                lat = params[i].substr(4);
            }
            if (params[i].indexOf('lng') > -1) {
                lng = params[i].substr(4);
            }
            if (params[i].indexOf('count') > -1) {
                count = params[i].substr(6);
            }
        }
        return {
            lat: lat,
            lng: lng,
            count: count
        }
    }

    function generateUrl(params) {
        var lat = params["lat"] || 0;
        var lng = params["lng"] || 0;
        var count = params["count"] || 10;

        var url = window.location.href;
        if (url.indexOf('?') > -1) {
            url = url.substr(0, url.indexOf('?'));
        }
        return url + '?lat=' + lat + '&lng=' + lng + '&count=' + count;
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
