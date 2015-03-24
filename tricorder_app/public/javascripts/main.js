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

function sendAjaxPost(url, data, successCallback) {
    $.ajax({
        url: url,
        type: "POST",
        dataType: "json",
        data: data,
        success: successCallback
    });
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
        config.filterModal.modal("show");
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

        if (Object.keys(stopLocations).length > 0) {
            // user nearest stop as the center of the map
            var nearestStopLocation = {lat: stopLocations[Object.keys(stopLocations)[0]]["lat"], lng: stopLocations[Object.keys(stopLocations)[0]]["lng"]};
            var googleMap = new GoogleMapsApiWrapper(nearestStopLocation, 17, config.mapContainer[0]);

            // add user marker
            var userLocation = {lat: params["lat"], lng: params["lng"]};
            googleMap.addMarker(
                userLocation,
                "<div class='map-info-window'><strong>You are here</strong></div>",
                true,
                "red",
                "user"
            );

            googleMap.addMarker(
                nearestStopLocation,
                "<div class='map-info-window'>" + "<strong>Nearest stop: </strong>" + Object.keys(stopLocations)[0] + "</div>",
                true,
                "yellow",
                "stop",
                function () {
                    googleMap.clearRoutes();
                    googleMap.addRoute(userLocation, nearestStopLocation, "walking");
                }
            );

            // add remaining stop markers
            var loopCounter = 0;
            for (var key in stopLocations) {
                if (stopLocations.hasOwnProperty(key)) {
                    if (loopCounter != 0) { // exclude nearest stop
                        var stopLocation = {lat: stopLocations[key]["lat"], lng: stopLocations[key]["lng"]};

                        (function (stopLocation) {
                            googleMap.addMarker(
                                stopLocation,
                                "<div class='map-info-window'>" + key + "</div>",
                                false,
                                "yellow",
                                "stop",
                                function () {
                                    googleMap.clearRoutes();
                                    googleMap.addRoute(userLocation, stopLocation, "walking");
                                }
                            );
                        })(stopLocation);
                    }
                    loopCounter++;
                }
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

var StopHandler = function () {

    var config = {
        mainContainer: $(".main-container"),
        mapContainer: $("#stop-map-container"),
        upcomingServiceTab: $(".tab"),
        tabContentContainer: $(".tab-content-container"),
        favouriteButton: $(".favourite-button"),
        favouriteModal: $("#favourite-modal"),
        favouriteForm: $("#favourite-form"),
        favouriteModalAltNameInput: $("#favourite-modal-alt-name-input"),
        favouriteModalStopIdInput : $("#favourite-modal-stop-id-input"),
        favouriteModalErrorContainer: $("#favourite-modal-error-container"),
        viewAllArrivalTimesLink: $(".view-all-arrival-times"),
        timetableModal: $("#timetable-modal"),
        timetableModalBody: $("#timetable-modal-body"),
        timetableModalTitle: $("#timetable-modal-title"),
        googleMap: null,
        viewLiveLocationsOnMapLink: $(".view-live-locations-on-map")
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

        setupMap(userLocation);

        // since hashchange event is not fired when the page is loaded with the hash,
        // navigateToActiveTab must be called once, and bus markers would also need to be
        // reset once
        navigateToActiveTab();
        resetBusLocationsOnMap();


        // navigate to active tab every time the hash changes
        $(window).on('hashchange', function () {
            navigateToActiveTab();
            resetBusLocationsOnMap();
        });

        bindUIActions();
    }

    function bindUIActions() {
        // if favourite button is disabled, enable its tooltip
        if (config.favouriteButton.attr("class").indexOf("disabled") > -1) {
            $('[data-toggle="tooltip"]').tooltip();
        } else {
            config.favouriteButton.click(function () {
                // show favourite modal if stop not in favourites already (blue button)
                if (config.favouriteButton.attr("class").indexOf("btn-primary") > -1) {
                    showFavouriteModal();
                } else { // else send ajax post request to remove stop from favourites (red button)
                    sendAjaxPost(
                        config.favouriteForm.attr("data-remove-action"),
                        {stop_id: config.favouriteModalStopIdInput.val()},
                        function (response) {
                            if (!response.error) {
                                config.favouriteButton.removeClass("btn-danger");
                                config.favouriteButton.addClass("btn-primary");
                                config.favouriteButton.find(".favourite-button-text").text("Add to Favourites");
                            } else {
                                alert("Error: " + response.error);
                            }
                        }
                    );
                }
            });
        }

        config.viewAllArrivalTimesLink.click(function (event) {
            event.preventDefault();

            var serviceName = $(this).attr("data-service-name");
            var stopId = $(this).attr("data-stop-id");
            var stopName = $(this).attr("data-stop-name");
            var url = $(this).attr("href") + "?service=" + serviceName  + "&stop=" + stopId;
            showTimetableModal(url, serviceName, stopName);
        });

        config.viewLiveLocationsOnMapLink.click(function () {
            // scroll to top of page
            $("html, body").animate({ scrollTop: 0 }, "300");
        });
    }

    function showFavouriteModal() {
        // hide error container initially
        config.favouriteModalErrorContainer.hide();

        config.favouriteForm.submit(function (event) {
            // prevent default form submission
            event.preventDefault();

            // submit form data using ajax
            sendAjaxPost(
                config.favouriteForm.attr("data-add-action"),
                {alt_name: config.favouriteModalAltNameInput.val(), stop_id: config.favouriteModalStopIdInput.val()},
                function (response) {
                    if (response.error) {
                        config.favouriteModalErrorContainer.empty();
                        config.favouriteModalErrorContainer.append("<strong>Error!</strong> " + response.error);
                        config.favouriteModalErrorContainer.show();
                    } else {
                        config.favouriteModal.modal("hide");
                        config.favouriteButton.removeClass("btn-primary");
                        config.favouriteButton.addClass("btn-danger");
                        config.favouriteButton.find(".favourite-button-text").text("Remove from Favourites");
                    }
                }
            );
        });

        config.favouriteModal.modal("show");
    }

    function setupMap(userLocation) {
        // get stop location since it would be used as the center of the map
        var stopLocation = {lat: config.mainContainer.find(".lat").text(), lng: config.mainContainer.find(".lng").text()};

        config.googleMap = new GoogleMapsApiWrapper(stopLocation, 17, config.mapContainer[0]);

        // add user marker
        config.googleMap.addMarker(
            userLocation,
            "<div class='map-info-window'><strong>You are here</strong></div>",
            true,
            "red",
            "user"
        );

        // add stop marker
        config.googleMap.addMarker(
            stopLocation,
            "<div class='map-info-window'>" + config.mainContainer.find(".main-title").text() + "</div>",
            true,
            "yellow",
            "stop"
        );

        // add route between user and stop
        config.googleMap.addRoute(userLocation, stopLocation, "walking");
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

    function showTimetableModal(url, serviceName, stopName) {
        // load timetables html into modal body
        $.ajax({
            url: url,
            type: "GET",
            dataType: "html",
            success: function (html) {
                config.timetableModal.modal("show");
                config.timetableModalTitle.html("<strong>Arrival times for Service " + serviceName + " at " + stopName + "</strong>");
                config.timetableModalBody.html(html);
            }
        });

        // handle tab navigation
        config.timetableModalBody.on("click", ".day-tab", function () {
            // only mark selected tab as active
            $(this).addClass("active");
            $(this).siblings().removeClass("active");

            // only show the content of the clicked tab
            var activeTabContentClass = "." + $(this).text().toLowerCase() + "-tab-content";
            var activeTabContent = $(activeTabContentClass);
            activeTabContent.show();
            activeTabContent.siblings().hide();
        });
    }

    function resetBusLocationsOnMap() {
        // remove all previous mus markers
        var markers = config.googleMap.getMarkers();
        for (var i=0; i<markers.length; i++) {
            if (markers[i].id == "bus") {
                markers[i].remove();
            }
        }

        // get all bus locations
        var busLocations = {};
        $(".bus-container:visible").each(function () {
            var busContainer = $(this);
            busLocations[busContainer.children(".title").text()] = {
                lat: busContainer.attr("data-lat"),
                lng: busContainer.attr("data-lng")
            };
        });

        // add bus markers to map
        for (var key in busLocations) {
            if (busLocations.hasOwnProperty(key)) {
                var busLocation = {lat: busLocations[key]["lat"], lng: busLocations[key]["lng"]};

                config.googleMap.addMarker(
                    busLocation,
                    "<div class='map-info-window'>" + key + "</div>",
                    false,
                    "bus",
                    "bus"
                )
            }
        }
    }

    return {
        init: init
    };
}();

var FavouritesHandler = function () {
    var config = {
        favourite: $(".favourite"),
        removeFavouriteButton: $(".remove-favourite-button")
    };

    function init() {
        bindUIActions();
    }

    function bindUIActions() {
        config.favourite.click(function (event) {
            event.preventDefault();
            var self = $(this);
            LocationFetcher.getCurrentPosition(function (position) {
                window.location.href = self.attr("data-href") + "?lat=" + position.coords.latitude + "&lng=" + position.coords.longitude;
            });
        });

        config.removeFavouriteButton.click(function (event) {
            event.stopPropagation();
            var parent = $(this).parents(".favourite");
            sendAjaxPost(
                parent.attr("data-remove-href"),
                {stop_id: parent.attr("data-stop-id")},
                function (response) {
                    if (!response.error) {
                        window.location.reload();
                    } else {
                        alert("Error: " + response.error);
                    }
                }
            );
        });

        // enable tooltips
        $('[data-toggle="tooltip"]').tooltip();
    }

    return {
        init: init
    };
}();

function GoogleMapsApiWrapper(centerLocation, zoomLevel, mapContainer) {
    var config = {
        map: null,
        directionsRenderer: null,
        directionsService: null,
        markers: [],
        markerIcons: {
            purple: "http://maps.google.com/intl/en_us/mapfiles/ms/micons/purple-dot.png",
            yellow: "http://maps.google.com/intl/en_us/mapfiles/ms/micons/yellow-dot.png",
            blue: "http://maps.google.com/intl/en_us/mapfiles/ms/micons/blue-dot.png",
            green: "http://maps.google.com/intl/en_us/mapfiles/ms/micons/green-dot.png",
            red: "http://maps.google.com/intl/en_us/mapfiles/ms/micons/red-dot.png",
            orange: "http://maps.google.com/intl/en_us/mapfiles/ms/micons/orange-dot.png",
            bus: "https://maps.gstatic.com/mapfiles/ms2/micons/bus.png"
        },
        travelModes: {
            walking: google.maps.TravelMode.WALKING,
            driving: google.maps.TravelMode.DRIVING,
            bicycling: google.maps.TravelMode.BICYCLING
        }
    };

    // self invoking initialization method
    var init = function () {
        // setup map
        var options = {
            zoom: zoomLevel,
            center: new google.maps.LatLng(centerLocation["lat"], centerLocation["lng"]),
            mapTypeControl: false
        };
        config.map = new google.maps.Map(mapContainer, options);

        // setup directions renderer which will draw routes on map
        config.directionsRenderer = new google.maps.DirectionsRenderer();
        config.directionsRenderer.setOptions({suppressMarkers: true, preserveViewport: true});
        config.directionsRenderer.setMap(config.map);

        // setup directions service which will retrieve the required route
        config.directionsService = new google.maps.DirectionsService();
    }();

    this.addMarker = function (location, infoWindowContent, shouldOpenInfoWindowInitially, markerIcon, markerId, doubleClickCallback) {
        var infoWindow = new google.maps.InfoWindow({
            content: infoWindowContent
        });

        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(location["lat"], location["lng"]),
            map: config.map,
            icon: new google.maps.MarkerImage(config.markerIcons[markerIcon] || config.markerIcons.red)
        });
        marker.setMap(config.map);

        // add id property to each marker so that it can easily be recognized later
        marker.id = markerId;

        // add remove method to marker
        marker.remove = function () {
            marker.setMap(null);
        };

        //show info window when marker is clicked
        google.maps.event.addListener(marker, 'click', function() {
            infoWindow.open(config.map, marker);
        });

        if (shouldOpenInfoWindowInitially) {
            // initially show info window
            infoWindow.open(config.map, marker);
        }

        // handle double click using the callback provided
        if (doubleClickCallback != undefined) {
            google.maps.event.addListener(marker, 'dblclick', doubleClickCallback);
        }

        // keep marker reference for later use
        config.markers.push(marker);

    };

    this.addRoute = function (origin, destination, travelMode) {
        var request = {
            origin: new google.maps.LatLng(origin["lat"], origin["lng"]),
            destination: new google.maps.LatLng(destination["lat"], destination["lng"]),
            travelMode: config.travelModes[travelMode] || config.travelModes.walking
        };

        config.directionsService.route(request, function (res, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                config.directionsRenderer.setDirections(res);
            } else {
                console.log("Error occurred while adding route: " + status);
            }
        });
    };

    this.clearRoutes = function () {
        config.directionsRenderer.setDirections({routes: []});
    };

    this.clearMarkers = function () {
        for (var i=0; i<config.markers.length; i++) {
            config.markers[i].remove();
        }
    };

    this.getMarkers = function () {
        return config.markers;
    }
}

// function calls go here
$(document).ready(function () {
    TabNavigationHandler.init();

    // only initialize the modules required for the current page
    if (window.location.href.indexOf('/nearby-stops') > -1) {
        NearbyStopsHandler.init();
    } else if (window.location.href.indexOf("/stop/") > -1) {
        StopHandler.init();
    } else if (window.location.href.indexOf("/favourites") > -1) {
        FavouritesHandler.init();
    }
});
