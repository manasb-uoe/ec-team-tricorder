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
        countSelected: $("#count-selected").text(),
        serviceSelected: $("#service-selected").text().split(","),
        filterModal: $("#filter-modal"),
        filterModalBody: $("#filter-modal-body"),
        filterModalCountSelect: $("#filter-modal-count-select"),
        filterModalServiceSelect: $("#filter-modal-service-select"),
        filterModalPositiveButton: $("#filter-modal-positive-button")
    };

    function init() {
        var params = getLocationParamsFromUrl();
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
            var params = getLocationParamsFromUrl();
            params["count"] = config.filterModalCountSelect.val();
            params["service"] = config.filterModalServiceSelect.val();
            window.location.href = generateUrl(params);
        });
    }

    function showFilterModal() {
        config.filterModalCountSelect.find("option[value='" + config.countSelected + "']").attr("selected", true);
        for (var i=0; i<config.serviceSelected.length; i++) {
            config.filterModalServiceSelect.find("option[value='" + config.serviceSelected[i] + "']").attr("selected", true);
        }
        config.filterModal.modal();
    }

    function getLocationParamsFromUrl() {
        var params = window.location.search.substr(1).split('&');
        var lat = null;
        var lng = null;
        for (var i=0; i < params.length; i++) {
            if (params[i].indexOf('lat') > -1) {
                lat = params[i].substr(4);
            }
            if (params[i].indexOf('lng') > -1) {
                lng = params[i].substr(4);
            }
        }
        return {
            lat: lat,
            lng: lng
        }
    }

    function generateUrl(params) {
        var lat = params["lat"] || 0;
        var lng = params["lng"] || 0;
        var count = params["count"] || 10;
        var service = params["service"] || ["All"];

        var url = window.location.href;
        if (url.indexOf('?') > -1) {
            url = url.substr(0, url.indexOf('?'));
        }
        url += '?lat=' + lat + '&lng=' + lng + '&count=' + count;
        for (var i=0; i<service.length; i++) {
            url += "&service[]=" + service[i];
        }
        return url;
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
