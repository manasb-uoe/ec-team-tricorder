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
        // get locations of all stops
        var stopLocations = {};
        config.stopContainer.each(function () {
            var stopContainer = $(this);
            stopLocations[stopContainer.find(".title").text()] = {
                lat: stopContainer.children(".lat").text(),
                lng: stopContainer.children(".lng").text()
            };
        });

        // user nearest stop as the center of the map
        var nearestStopLocation = {lat: stopLocations[Object.keys(stopLocations)[0]]["lat"], lng: stopLocations[Object.keys(stopLocations)[0]]["lng"]};
        MapHandler.init(nearestStopLocation, 17, config.mapContainer[0]);

        // add user marker
        var userLocation = {lat: params["lat"], lng: params["lng"]};
        MapHandler.addMarker(
            userLocation,
            "<div class='map-info-window'><strong>You are here</strong></div>",
            true
        );

        // add nearest stop marker
        MapHandler.addMarker(
            nearestStopLocation,
            "<div class='map-info-window'>" + "<strong>Nearest stop: </strong>" + Object.keys(stopLocations)[0] + "</div>",
            true,
            "http://maps.google.com/intl/en_us/mapfiles/ms/micons/blue-dot.png",
            userLocation
        );

        // add remaining stop markers
        var loopCounter = 0;
        for (var key in stopLocations) {
            if (stopLocations.hasOwnProperty(key)) {
                if (loopCounter != 0) { // exclude nearest stop
                    var stopLocation ={lat: stopLocations[key]["lat"], lng: stopLocations[key]["lng"]};

                    MapHandler.addMarker(
                        stopLocation,
                        "<div class='map-info-window'>" + key + "</div>",
                        false,
                        "http://maps.google.com/intl/en_us/mapfiles/ms/micons/blue-dot.png",
                        userLocation
                    );
                }
                loopCounter++;
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
        map: null,
        directionsRenderer: null,
        directionsService: null
    };

    function init(centerLocations, zoomLevel, mapContainer) {
        // setup map
        var options = {
            zoom: zoomLevel,
            center: new google.maps.LatLng(centerLocations["lat"], centerLocations["lng"]),
            mapTypeControl: false
        };
        config.map = new google.maps.Map(mapContainer, options);

        // setup directions renderer which will draw routes on map
        config.directionsRenderer = new google.maps.DirectionsRenderer();
        config.directionsRenderer.setOptions({suppressMarkers: true, preserveViewport: true});
        config.directionsRenderer.setMap(config.map);

        // setup directions service which will retrieve the required route
        config.directionsService = new google.maps.DirectionsService();
    }

    function addMarker(location, infoWindowContent, shouldOpenInfoWindow, markerIconUrl, locationForHandlingDblClick) {
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

        // handle double click
        if (locationForHandlingDblClick != undefined) {
            google.maps.event.addListener(marker, 'dblclick', function () {
                // remove all existing routes before adding new route
                config.directionsRenderer.setDirections({routes: []});
                addRoute(locationForHandlingDblClick, location);
            });
        }
    }

    function addRoute(origin, destination) {
        var request = {
            origin: new google.maps.LatLng(origin["lat"], origin["lng"]),
            destination: new google.maps.LatLng(destination["lat"], destination["lng"]),
            travelMode: google.maps.TravelMode.WALKING
        };

        config.directionsService.route(request, function (res, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                config.directionsRenderer.setDirections(res);
            } else {
                console.log("Error occurred while adding route: " + status);
            }
        });
    }

    return {
        init: init,
        addMarker: addMarker,
        addRoute: addRoute
    }
}();

var StopHandler = function () {

    var config = {
        mainContainer: $(".main-container"),
        mapContainer: $("#stop-map-container"),
        upcomingServiceTab: $(".tab"),
        tabContentContainer: $(".tab-content-container")
    };

    function init() {
        var userLocation = getLocationParamsFromUrl();
        if (userLocation["lat"] == null || userLocation["lng"] == null) {
            // append user's current location to url and reload
            LocationFetcher.getCurrentPosition(function (position) {
                window.location.href = window.location.href + "?lat=" + position.coords.latitude + "&lng=" + position.coords.longitude;
            });
        }

        // if no hash found, add hash for the first tab
        if (window.location.hash == '') {
            var hash = config.upcomingServiceTab.first().find("a").attr("href");
            window.location.href = window.location.href + hash;
        }

        // since hashchange event is not fired when the page is loaded with the hash,
        // navigateToActiveTab must be called once
        navigateToActiveTab();

        // navigate to active tab every time the hash changes
        $(window).on('hashchange', function () {
            navigateToActiveTab();
        });

        setupMap(userLocation);
    }

    function setupMap(userLocation) {
        // get stop location since it would be used as the center of the map
        var stopLocation = {lat: config.mainContainer.find(".lat").text(), lng: config.mainContainer.find(".lng").text()};

        MapHandler.init(stopLocation, 17, config.mapContainer[0]);

        // add user marker
        MapHandler.addMarker(
            userLocation,
            "<div class='map-info-window'><strong>You are here</strong></div>",
            true
        );

        // add stop marker
        MapHandler.addMarker(
            stopLocation,
            "<div class='map-info-window'>" + config.mainContainer.find(".main-title").text() + "</div>",
            true,
            "http://maps.google.com/intl/en_us/mapfiles/ms/micons/blue-dot.png"
        );

        // add route between user and stop
        MapHandler.addRoute(userLocation, stopLocation);
    }

    function navigateToActiveTab() {
        var hash = window.location.hash;

        // make selected tab active
        var activeLink = $('a[href="' + hash +'"]');
        var activeTab = activeLink.parent();
        activeTab.addClass("active");

        // make all the other tabs inactive
        activeTab.siblings().removeClass("active");

        // only show the content of the clicked tab
        var activeContentDivClassName = activeTab.find(".service-name").text();
        var activeContentDiv = config.tabContentContainer.find("." + activeContentDivClassName);
        activeContentDiv.show();
        activeContentDiv.siblings().hide();
    }

    return {
        init: init
    };
}();


// function calls go here
$(document).ready(function () {
    TabNavigationHandler.init();

    // only initialize the modules required for the current page
    if (window.location.href.indexOf('/nearby-stops') > -1) {
        NearbyStopsHandler.init();
    } else if (window.location.href.indexOf("/stop/") > -1) {
        StopHandler.init();
    }
});
