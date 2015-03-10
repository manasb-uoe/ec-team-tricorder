/**
 * Created by Manas on 07-03-2015.
 */

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

var TabNavigationHandler = function () {
    var config = {
        nearbyStopsTab: $("#nearby-stops-tab")
    };

    function init() {
        bindUIActions();
    }

    function bindUIActions() {
        config.nearbyStopsTab.click(function (event) {
            event.preventDefault();
            LocationFetcher.getCurrentPosition(function (position) {
                window.location.href = config.nearbyStopsTab.attr("href") + "?lat=" + position.coords.latitude + "&lng=" + position.coords.longitude;
            });
        });
    }

    return {
        init: init
    };
}();

var NearbyStopsHandler = function () {
    var config = {
        nearbyStopsTab: $("#nearby-stops-tab"),
        mapContainer: $("#nearby-stops-map-container"),
        changeFilterButton: $("#change-filter-button"),
        countSelected: $("#count-selected").text(),
        serviceSelected: $("#service-selected").text().split(","),
        filterModal: $("#filter-modal"),
        filterModalBody: $("#filter-modal-body"),
        filterModalCountSelect: $("#filter-modal-count-select"),
        filterModalServiceSelect: $("#filter-modal-service-select"),
        filterModalPositiveButton: $("#filter-modal-positive-button"),
        stopContainer: $(".stop-container")
    };

    function init() {
        var params = getLocationParamsFromUrl();
        if (params["lat"] == null || params["lng"] == null) {
            // append user's current location to url and reload
            LocationFetcher.getCurrentPosition(function (position) {
                window.location.href = config.nearbyStopsTab.attr("href") + "?lat=" + position.coords.latitude + "&lng=" + position.coords.longitude;
            });
        }

        setupMap(params);

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

        config.stopContainer.click(function (event) {
            event.preventDefault();
            var self = $(this);
            LocationFetcher.getCurrentPosition(function (position) {
                window.location.href = self.attr("href") + "?lat=" + position.coords.latitude + "&lng=" + position.coords.longitude;
            });
        });
    }

    function showFilterModal() {
        config.filterModalCountSelect.find("option[value='" + config.countSelected + "']").attr("selected", true);
        for (var i=0; i<config.serviceSelected.length; i++) {
            config.filterModalServiceSelect.find("option[value='" + config.serviceSelected[i] + "']").attr("selected", true);
        }
        config.filterModal.modal();
    }

    function setupMap(params) {
        var userLocation = {lat: params["lat"], lng: params["lng"]};
        MapHandler.init(userLocation, config.mapContainer[0]);
        MapHandler.addMarker(
            userLocation,
            "<div class='map-info-window'><strong>You are here</strong></div>",
            true
        );

        // get locations of all stops
        var stopLocations = {};
        config.stopContainer.each(function () {
            var stopContainer = $(this);
            stopLocations[stopContainer.find(".title").text()] = {
                lat: stopContainer.children(".lat").text(),
                lng: stopContainer.children(".lng").text()
            };
        });

        // add marker for each location
        var isNearest = true;   // used to open the nearest stop marker's info window
        for (var key in stopLocations) {
            if (stopLocations.hasOwnProperty(key)) {
                var stopLocation ={lat: stopLocations[key]["lat"], lng: stopLocations[key]["lng"]};

                if (isNearest) {
                    MapHandler.addMarker(
                        stopLocation,
                        "<div class='map-info-window'>" + "<strong>Nearest stop: </strong>" + key + "</div>",
                        true,
                        "http://maps.google.com/intl/en_us/mapfiles/ms/micons/blue-dot.png"
                    );
                } else {
                    MapHandler.addMarker(
                        stopLocation,
                        "<div class='map-info-window'>" + key + "</div>",
                        false,
                        "http://maps.google.com/intl/en_us/mapfiles/ms/micons/blue-dot.png"
                    );
                }

                // now set isNearest to false since only the first stop in the dict is nearest
                isNearest = false;
            }
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

var MapHandler = function () {
    var config = {
        map: null
    };

    function init(centerLocations, mapContainer) {
        var options = {
            zoom: 17,
            center: new google.maps.LatLng(centerLocations["lat"], centerLocations["lng"]),
            mapTypeControl: false,
            navigationControlOptions: {
                style: google.maps.NavigationControlStyle.SMALL
            },
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        config.map = new google.maps.Map(mapContainer, options);
    }

    function addMarker(location, infoWindowContent, shouldOpenInfoWindow, markerIconUrl) {
        markerIconUrl = markerIconUrl == undefined ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png" : markerIconUrl;

        var infoWindow = new google.maps.InfoWindow({
            content: infoWindowContent
        });

        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(location["lat"], location["lng"]),
            map: config.map,
            icon: new google.maps.MarkerImage(markerIconUrl)
        });
        marker.setMap(config.map);

        //show info window when marker is clicked
        google.maps.event.addListener(marker, 'click', function() {
            infoWindow.open(config.map, marker);
        });

        if (shouldOpenInfoWindow) {
            // initially show info window
            infoWindow.open(config.map, marker);
        }
    }

    return {
        init: init,
        addMarker: addMarker
    }
}();


// function calls go here
$(document).ready(function () {
    TabNavigationHandler.init();

    // only initialize the modules required for the current page
    if (window.location.href.indexOf('/nearby-stops') > -1) {
        NearbyStopsHandler.init();
    }
});
