/**
 * Created by Manas on 07-03-2015.
 */
/// <reference path="./ts_definitions/jquery.d.ts" />
/// <reference path="./ts_definitions/google.maps.d.ts" />
/// <reference path="./ts_definitions/bootstrap.d.ts" />
/// <reference path="./ts_definitions/highcharts.d.ts" />
function getLocationParamsFromUrl() {
    var params = window.location.search.substr(1).split('&');
    var lat = null;
    var lng = null;
    for (var i = 0; i < params.length; i++) {
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
    };
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
        switch (error.code) {
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
        stopQuery: $("#stop-query").text(),
        countSelected: $("#count-selected").text(),
        serviceSelected: $("#service-selected").text().split(","),
        filterModal: $("#filter-modal"),
        filterModalBody: $("#filter-modal-body"),
        filterModalCountSelect: $("#filter-modal-count-select"),
        filterModalServiceSelect: $("#filter-modal-service-select"),
        filterModalStopQueryInput: $("#filter-modal-stop-query"),
        filterModalPositiveButton: $("#filter-modal-positive-button"),
        stopContainer: $(".stop-container"),
        googleMap: null,
        googleMapWidth: null,
        googleMapHeight: null,
        enterFullScreenMap: $(".enter-full-screen-map"),
        exitFullScreenMap: $(".exit-full-screen-map")
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
            params["stop"] = config.filterModalStopQueryInput.val();
            window.location.href = generateUrl(params);
        });
        config.stopContainer.click(function (event) {
            event.preventDefault();
            var self = $(this);
            LocationFetcher.getCurrentPosition(function (position) {
                window.location.href = self.attr("href") + "?lat=" + position.coords.latitude + "&lng=" + position.coords.longitude;
            });
        });
        config.enterFullScreenMap.click(function (event) {
            event.preventDefault();
            config.mapContainer.css({
                "position": "fixed",
                "top": "50px",
                "left": "0",
                "height": "100%",
                "z-index": "1000"
            });
            config.googleMap.triggerResize();
            config.exitFullScreenMap.show();
        });
        config.exitFullScreenMap.click(function () {
            config.mapContainer.css({
                "position": "relative",
                "top": "0",
                "left": "0",
                "height": config.googleMapHeight,
                "z-index": config.googleMapWidth
            });
            config.googleMap.triggerResize();
            $(this).hide();
        });
    }
    function showFilterModal() {
        config.filterModalStopQueryInput.val(config.stopQuery);
        config.filterModalCountSelect.find("option[value='" + config.countSelected + "']").attr("selected", true);
        for (var i = 0; i < config.serviceSelected.length; i++) {
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
            var nearestStopLocation = { lat: stopLocations[Object.keys(stopLocations)[0]]["lat"], lng: stopLocations[Object.keys(stopLocations)[0]]["lng"] };
            config.googleMap = new GoogleMapsApiWrapper(nearestStopLocation, 17, config.mapContainer[0]);
            // get initial dimensions so that we can switch back to them later
            config.googleMapWidth = config.mapContainer.css('width');
            config.googleMapHeight = config.mapContainer.css('height');
            // add user marker
            var userLocation = { lat: params["lat"], lng: params["lng"] };
            config.googleMap.addMarker("user", userLocation, {
                icon: "red",
                infoWindowContent: "<div class='map-info-window'><strong>You are here</strong></div>",
                shouldOpenInfoWindowInitially: true
            });
            // add nearest stop marker
            config.googleMap.addMarker("stop", nearestStopLocation, {
                icon: "yellow",
                infoWindowContent: "<div class='map-info-window'>" + "<strong>Nearest stop: </strong>" + Object.keys(stopLocations)[0] + "</div>",
                shouldOpenInfoWindowInitially: true,
                doubleClickCallback: function () {
                    config.googleMap.clearRoutes();
                    config.googleMap.addRoute(userLocation, nearestStopLocation, "walking");
                }
            });
            // add remaining stop markers
            var loopCounter = 0;
            for (var key in stopLocations) {
                if (stopLocations.hasOwnProperty(key)) {
                    if (loopCounter != 0) {
                        var stopLocation = { lat: stopLocations[key]["lat"], lng: stopLocations[key]["lng"] };
                        (function (stopLocation) {
                            config.googleMap.addMarker("stop", stopLocation, {
                                icon: "yellow",
                                infoWindowContent: "<div class='map-info-window'>" + key + "</div>",
                                shouldOpenInfoWindowInitially: false,
                                doubleClickCallback: function () {
                                    config.googleMap.clearRoutes();
                                    config.googleMap.addRoute(userLocation, stopLocation, "walking");
                                }
                            });
                        }(stopLocation));
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
        var stop = params["stop"] || "";
        var url = window.location.href;
        if (url.indexOf('?') > -1) {
            url = url.substr(0, url.indexOf('?'));
        }
        url += '?lat=' + lat + '&lng=' + lng + '&stop=' + stop + '&count=' + count;
        for (var i = 0; i < service.length; i++) {
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
        favouriteModalStopIdInput: $("#favourite-modal-stop-id-input"),
        favouriteModalErrorContainer: $("#favourite-modal-error-container"),
        viewAllArrivalTimesLink: $(".view-all-arrival-times"),
        timetableModal: $("#timetable-modal"),
        timetableModalBody: $("#timetable-modal-body"),
        timetableModalTitle: $("#timetable-modal-title"),
        googleMap: null,
        googleMapWidth: null,
        googleMapHeight: null,
        viewLiveLocationsOnMapLink: $(".view-live-locations-on-map"),
        enterFullScreenMap: $(".enter-full-screen-map"),
        exitFullScreenMap: $(".exit-full-screen-map"),
        mapViewStopButton: $("#map-view-stop-button"),
        mapViewBusesAndRoutesButton: $("#map-view-buses-and-routes-button"),
        busContainer: $(".bus-container")
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
        // navigateToActiveTab must be called once
        navigateToActiveTab();
        showUserAndStopLocationOnMap(userLocation);
        // navigate to active tab every time the hash changes
        $(window).on('hashchange', function () {
            navigateToActiveTab();
            if (config.mapViewBusesAndRoutesButton.attr("class").indexOf("btn-primary") > -1) {
                showBusLocationAndRoutesOnMap();
            }
        });
        bindUIActions(userLocation);
    }
    function bindUIActions(userLocation) {
        // if favourite button is disabled, enable its tooltip
        if (config.favouriteButton.attr("class").indexOf("disabled") > -1) {
            $('[data-toggle="tooltip"]').tooltip();
        }
        else {
            config.favouriteButton.click(function () {
                // show favourite modal if stop not in favourites already (blue button)
                if (config.favouriteButton.attr("class").indexOf("btn-primary") > -1) {
                    showFavouriteModal();
                }
                else {
                    sendAjaxPost(config.favouriteForm.attr("data-remove-action"), { stop_id: config.favouriteModalStopIdInput.val() }, function (response) {
                        if (!response.error) {
                            config.favouriteButton.removeClass("btn-danger");
                            config.favouriteButton.addClass("btn-primary");
                            config.favouriteButton.find(".favourite-button-text").text("Add to Favourites");
                        }
                        else {
                            alert("Error: " + response.error);
                        }
                    });
                }
            });
        }
        config.viewAllArrivalTimesLink.click(function (event) {
            event.preventDefault();
            var serviceName = $(this).attr("data-service-name");
            var stopId = $(this).attr("data-stop-id");
            var stopName = $(this).attr("data-stop-name");
            var url = $(this).attr("href") + "?service=" + serviceName + "&stop=" + stopId;
            showTimetableModal(url, serviceName, stopName);
        });
        config.viewLiveLocationsOnMapLink.click(function () {
            // scroll to top of page
            $("html, body").animate({ scrollTop: 0 }, "300");
        });
        config.enterFullScreenMap.click(function (event) {
            event.preventDefault();
            config.mapContainer.css({
                "position": "fixed",
                "top": "50px",
                "left": "0",
                "height": "100%",
                "z-index": "1000"
            });
            config.googleMap.triggerResize();
            config.exitFullScreenMap.show();
        });
        config.exitFullScreenMap.click(function () {
            config.mapContainer.css({
                "position": "relative",
                "top": "0",
                "left": "0",
                "height": config.googleMapHeight,
                "z-index": config.googleMapWidth
            });
            config.googleMap.triggerResize();
            $(this).hide();
        });
        config.mapViewStopButton.click(function () {
            if ($(this).attr("class").indexOf("btn-primary") == -1) {
                $(this).removeClass("btn-default");
                $(this).addClass("btn-primary");
                config.mapViewBusesAndRoutesButton.removeClass("btn-primary");
                config.mapViewBusesAndRoutesButton.addClass("btn-default");
                showUserAndStopLocationOnMap(userLocation);
            }
        });
        config.mapViewBusesAndRoutesButton.click(function () {
            if ($(this).attr("class").indexOf("btn-primary") == -1) {
                $(this).removeClass("btn-default");
                $(this).addClass("btn-primary");
                config.mapViewStopButton.removeClass("btn-primary");
                config.mapViewStopButton.addClass("btn-default");
                showBusLocationAndRoutesOnMap();
            }
        });
        config.busContainer.click(function () {
            console.log(config.googleMap.getMarkers().length);
            if (config.mapViewBusesAndRoutesButton.attr("class").indexOf("btn-primary") == -1) {
                config.mapViewBusesAndRoutesButton.trigger("click");
            }
            var busLocation = { lat: $(this).attr("data-lat"), lng: $(this).attr("data-lng") };
            var busMarkers = config.googleMap.getMarkers("bus");
            for (var i = 0; i < busMarkers.length; i++) {
                if (busMarkers[i].getPosition().lat().toFixed(6) == parseFloat(busLocation["lat"]).toFixed(6) && busMarkers[i].getPosition().lng().toFixed(6) == parseFloat(busLocation["lng"]).toFixed(6)) {
                    config.googleMap.setCenter(busLocation);
                    config.googleMap.setZoom(17);
                    busMarkers[i].infoWindow("show");
                }
                else {
                    busMarkers[i].infoWindow("hide");
                }
            }
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
            sendAjaxPost(config.favouriteForm.attr("data-add-action"), { alt_name: config.favouriteModalAltNameInput.val(), stop_id: config.favouriteModalStopIdInput.val() }, function (response) {
                if (response.error) {
                    config.favouriteModalErrorContainer.empty();
                    config.favouriteModalErrorContainer.append("<strong>Error!</strong> " + response.error);
                    config.favouriteModalErrorContainer.show();
                }
                else {
                    config.favouriteModal.modal("hide");
                    config.favouriteButton.removeClass("btn-primary");
                    config.favouriteButton.addClass("btn-danger");
                    config.favouriteButton.find(".favourite-button-text").text("Remove from Favourites");
                }
            });
        });
        config.favouriteModal.modal("show");
    }
    function setupMap(userLocation) {
        config.googleMap = new GoogleMapsApiWrapper(userLocation, 17, config.mapContainer[0]);
        // get initial dimensions so that we can switch back to them later
        config.googleMapWidth = config.mapContainer.css('width');
        config.googleMapHeight = config.mapContainer.css('height');
    }
    function navigateToActiveTab() {
        var hash = window.location.hash;
        // make selected tab active
        var activeLink = $('a[href="' + hash + '"]');
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
    function showBusLocationAndRoutesOnMap() {
        config.googleMap.clearPolylines();
        config.googleMap.clearMarkers();
        config.googleMap.clearRoutes();
        config.googleMap.setZoom(12);
        // get service name from active tab
        var serviceName = $(".tab[class*='active']").children("a").attr("href").substring(1);
        // get routes for selected service from server and mark them on map
        $.ajax({
            url: config.mapViewBusesAndRoutesButton.attr("data-href") + "?service=" + serviceName,
            type: "GET",
            dataType: "json",
            success: function (routes) {
                var destinations = Object.keys(routes);
                var polylineColors = ["#34dbff", "#ff3497", "#ff0040", "#64e125", "#005567", "#9c34ff"];
                for (var i = 0; i < destinations.length; i++) {
                    var route = routes[destinations[i]];
                    var coordinates = [];
                    for (var j = 0; j < route.length; j++) {
                        if (route[j] != null) {
                            coordinates.push({ lat: route[j].coordinates[1], lng: route[j].coordinates[0] });
                        }
                    }
                    config.googleMap.addPolyline(coordinates, {
                        strokeColor: polylineColors[i],
                        strokeWeight: 3
                    });
                }
            }
        });
        // get all bus locations
        var busLocations = {};
        $(".bus-container:visible").each(function () {
            var busContainer = $(this);
            busLocations[busContainer.find(".title").text()] = {
                lat: busContainer.attr("data-lat"),
                lng: busContainer.attr("data-lng")
            };
        });
        for (var key in busLocations) {
            if (busLocations.hasOwnProperty(key)) {
                var busLocation = { lat: busLocations[key]["lat"], lng: busLocations[key]["lng"] };
                config.googleMap.addMarker("bus", busLocation, {
                    icon: "bus",
                    infoWindowContent: "<div class='map-info-window'>" + key + "</div>",
                    shouldOpenInfoWindowInitially: false
                });
            }
        }
    }
    function showUserAndStopLocationOnMap(userLocation) {
        config.googleMap.clearPolylines();
        config.googleMap.clearMarkers();
        config.googleMap.clearRoutes();
        config.googleMap.setCenter(userLocation);
        config.googleMap.setZoom(17);
        // add user marker
        config.googleMap.addMarker("user", userLocation, {
            icon: "red",
            infoWindowContent: "<div class='map-info-window'><strong>You are here</strong></div>",
            shouldOpenInfoWindowInitially: true
        });
        // get stop location since it would be used as the center of the map
        var stopLocation = { lat: config.mainContainer.find(".lat").text(), lng: config.mainContainer.find(".lng").text() };
        // add stop marker
        config.googleMap.addMarker("stop", stopLocation, {
            icon: "yellow",
            infoWindowContent: "<div class='map-info-window'>" + config.mainContainer.find(".main-title").text() + "</div>",
            shouldOpenInfoWindowInitially: true
        });
        // add route between user and stop
        config.googleMap.addRoute(userLocation, stopLocation, "walking");
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
            sendAjaxPost(parent.attr("data-remove-href"), { stop_id: parent.attr("data-stop-id") }, function (response) {
                if (!response.error) {
                    window.location.reload();
                }
                else {
                    alert("Error: " + response.error);
                }
            });
        });
        // enable tooltips
        $('[data-toggle="tooltip"]').tooltip();
    }
    return {
        init: init
    };
}();
var StatisticsChartHandler = function () {
    var config = {
        busChart: $("#bus-chart"),
        //stopChart: $("#stop-chart"),
        busContainer: $(".bus-container"),
        currentStopId: window.location.pathname.slice(-8),
        statsButton: $(".stats-button"),
        busStatsModal: $("#bus-stats-modal"),
        busStatsModalTitle: $("#bus-stats-modal-title")
    };
    function init() {
        bindUIActions();
    }
    function bindUIActions() {
        config.statsButton.click(function (event) {
            event.stopPropagation();
            config.busStatsModal.modal();
            var bus_id_chart_raw = $(this).parents(".bus-container").find('.title').text();
            var tmp = bus_id_chart_raw.substring(5, 8); //get the id of the bus
            var bus_id_chart = tmp.replace(' ', ''); // remove any extra whitespaces
            config.busStatsModalTitle.text("Bus statistics for bus #" + bus_id_chart); //add title for the chart popup window
            busChartGenerator(bus_id_chart);
        });
    }
    function busChartGenerator(bus_id_chart) { //create a Highcharts chart
        $.ajax({ //ajax call to get the data for a specific bus
            url: "/api/vehicle/" + "?id=" + bus_id_chart + "&period=" + "daily",
            type: "GET",
            dataType: "json",
            success: function (json) {
                config.busChart.highcharts({
                    chart: {
                        type: 'column',
                        width: 868
                    },
                    title: {
                        text: ''
                    },
                    xAxis: {
                        type: 'category',
                        labels: {
                            rotation: -90,
                            style: {
                                fontSize: '11px',
                                fontFamily: 'Verdana, sans-serif'
                            }
                        }
                    },
                    yAxis: {
                        min: 0,
                        title: {
                            text: 'Number of buses'
                        }
                    },
                    legend: {
                        enabled: false
                    },
                    tooltip: {
                        pointFormat: 'Number of buses: <b>{point.y:.1f}</b>'
                    },
                    series: [{
                        name: 'Population',
                        data: [
                            ['Early by more than 10 min', json["early_10_plus"]],
                            ['Early by 10 min', json["early_10"]],
                            ['Early by 9 min', json["early_9"]],
                            ['Early by 8 min', json["early_8"]],
                            ['Early by 7 min', json["early_7"]],
                            ['Early by 6 min', json["early_6"]],
                            ['Early by 4 min', json["early_4"]],
                            ['Early by 3 min', json["early_3"]],
                            ['Early by 2 min', json["early_2"]],
                            ['On time', json["on_time"]],
                            ['Late by 2 min', json["late_2"]],
                            ['Late by 3 min', json["late_3"]],
                            ['Late by 4 min', json["late_4"]],
                            ['Late by 5 min', json["late_5"]],
                            ['Late by 6 min', json["late_6"]],
                            ['Late by 7 min', json["late_7"]],
                            ['Late by 8 min', json["late_8"]],
                            ['Late by 9 min', json["late_9"]],
                            ['Late by 10 min', json["late_10"]],
                            ['Late by more than', json["late_10_plus"]]
                        ],
                        dataLabels: {
                            enabled: true,
                            formatter:function(){
                                if(this.y > 0)
                                    return this.y;
                            },
                            rotation: -90,
                            color: '#FFFFFF',
                            align: 'right',
                            y: 10,
                            style: {
                                fontSize: '9px',
                                fontFamily: 'Verdana, sans-serif'
                            }
                        }
                    }]
                });
            }
        });
    }
    //function stopChartGenerator(currentStop){
    //    $.ajax({
    //        url: "/api/stop/" + "?id=" + currentStop + "&period=" + "daily",
    //        type: "GET",
    //        dataType: "json",
    //        success: function (json) {
    //            config.stopChart.highcharts({
    //                chart: {
    //                    type: 'column'
    //                },
    //                title: {
    //                    text: 'Statistics for bus stop '+ currentStop
    //                },
    //                xAxis: {
    //                    type: 'category',
    //                    labels: {
    //                        rotation: -45,
    //                        style: {
    //                            fontSize: '13px',
    //                            fontFamily: 'Verdana, sans-serif'
    //                        }
    //                    }
    //                },
    //                yAxis: {
    //                    min: 0,
    //                    title: {
    //                        text: 'Number of buses'
    //                    }
    //                },
    //                legend: {
    //                    enabled: false
    //                },
    //                tooltip: {
    //                    pointFormat: 'Number of buses: <b>{point.y:.1f}</b>'
    //                },
    //                series: [{
    //                    name: 'Population',
    //                    data: [
    //                        ['Early by more than 10 min', json["early_10_plus"]],
    //                        ['Early by 10 min', json["early_10"]],
    //                        ['Early by 9 min', json["early_9"]],
    //                        ['Early by 8 min', json["early_8"]],
    //                        ['Early by 7 min', json["early_7"]],
    //                        ['Early by 6 min', json["early_6"]],
    //                        ['Early by 4 min', json["early_4"]],
    //                        ['Early by 3 min', json["early_3"]],
    //                        ['Early by 2 min', json["early_2"]],
    //                        ['On time', json["on_time"]],
    //                        ['Late by 2 min', json["late_2"]],
    //                        ['Late by 3 min', json["late_3"]],
    //                        ['Late by 4 min', json["late_4"]],
    //                        ['Late by 5 min', json["late_5"]],
    //                        ['Late by 6 min', json["late_6"]],
    //                        ['Late by 7 min', json["late_7"]],
    //                        ['Late by 8 min', json["late_8"]],
    //                        ['Late by 9 min', json["late_9"]],
    //                        ['Late by 10 min', json["late_10"]],
    //                        ['Late by more than', json["late_10_plus"]]
    //                    ],
    //                    dataLabels: {
    //                        enabled: true,
    //                        rotation: -90,
    //                        color: '#FFFFFF',
    //                        align: 'right',
    //                        format: '{point.y:.1f}', // one decimal
    //                        y: 10, // 10 pixels down from the top
    //                        style: {
    //                            fontSize: '13px',
    //                            fontFamily: 'Verdana, sans-serif'
    //                        }
    //                    }
    //                }]
    //            });
    //        }
    //    });
    //}
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
        polylines: [],
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
    (function init() {
        // setup map
        var options = {
            zoom: zoomLevel,
            center: new google.maps.LatLng(centerLocation["lat"], centerLocation["lng"]),
            mapTypeControl: false
        };
        config.map = new google.maps.Map(mapContainer, options);
        // setup directions renderer which will draw routes on map
        config.directionsRenderer = new google.maps.DirectionsRenderer();
        config.directionsRenderer.setOptions({ suppressMarkers: true, preserveViewport: true });
        config.directionsRenderer.setMap(config.map);
        // setup directions service which will retrieve the required route
        config.directionsService = new google.maps.DirectionsService();
    })();
    this.addMarker = function (id, position, options) {
        var markerOptions = {
            icon: options.icon || "red",
            singleClickCallback: options.singleClickCallback,
            doubleClickCallback: options.doubleClickCallback,
            infoWindowContent: options.infoWindowContent,
            shouldOpenInfoWindowInitially: options.shouldOpenInfoWindowInitially || false
        };
        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(position["lat"], position["lng"]),
            map: config.map,
            icon: new google.maps.MarkerImage(config.markerIcons[markerOptions.icon])
        });
        var infoWindow;
        if (markerOptions.infoWindowContent) {
            infoWindow = new google.maps.InfoWindow({
                content: markerOptions.infoWindowContent
            });
        }
        marker.setMap(config.map);
        // add id property to each marker so that it can easily be recognized later
        marker.id = id;
        // add method to open info window
        marker.infoWindow = function (state) {
            if (infoWindow) {
                if (state == "show") {
                    infoWindow.open(config.map, marker);
                }
                else if (state == "hide") {
                    infoWindow.close(config.map, marker);
                }
            }
            else {
                throw new Error("Info window content was not provided when marker was created");
            }
        };
        if (markerOptions.shouldOpenInfoWindowInitially) {
            if (infoWindow) {
                infoWindow.open(config.map, marker);
            }
        }
        // handle single click using the callback provided
        google.maps.event.addListener(marker, 'click', function () {
            marker.infoWindow("show");
            if (markerOptions.singleClickCallback) {
                markerOptions.singleClickCallback();
            }
        });
        // handle double click using the callback provided
        if (markerOptions.doubleClickCallback) {
            google.maps.event.addListener(marker, 'dblclick', markerOptions.doubleClickCallback);
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
            }
            else {
                console.log("Error occurred while adding route: " + status);
            }
        });
    };
    this.addPolyline = function (pathCoordinates, options) {
        for (var i = 0; i < pathCoordinates.length; i++) {
            pathCoordinates[i] = new google.maps.LatLng(pathCoordinates[i]["lat"], pathCoordinates[i]["lng"]);
        }
        var path = new google.maps.Polyline({
            path: pathCoordinates,
            geodesic: options.geodesic || true,
            strokeColor: options.strokeColor || '#FF0000',
            strokeOpacity: options.strokeOpacity || 1.0,
            strokeWeight: options.strokeWeight || 2
        });
        path.setMap(config.map);
        // keep polyline reference for later use
        config.polylines.push(path);
    };
    this.clearRoutes = function () {
        config.directionsRenderer.setDirections({ routes: [] });
    };
    this.clearMarkers = function () {
        for (var i = 0; i < config.markers.length; i++) {
            config.markers[i].setMap(null);
        }
        config.markers = [];
    };
    this.clearPolylines = function () {
        for (var i = 0; i < config.polylines.length; i++) {
            config.polylines[i].setMap(null);
        }
        config.polylines = [];
    };
    this.getMarkers = function (markerId) {
        if (markerId) {
            var filteredMarkers = [];
            for (var i = 0; i < config.markers.length; i++) {
                if (config.markers[i].id == markerId) {
                    filteredMarkers.push(config.markers[i]);
                }
            }
            return filteredMarkers;
        }
        else {
            return config.markers;
        }
    };
    this.triggerResize = function () {
        google.maps.event.trigger(config.map, 'resize');
    };
    this.setZoom = function (zoomLevel) {
        config.map.setZoom(zoomLevel);
    };
    this.setCenter = function (centerLocation) {
        config.map.setCenter(new google.maps.LatLng(centerLocation["lat"], centerLocation["lng"]));
    };
}
// function calls go here
$(document).ready(function () {
    TabNavigationHandler.init();
    // only initialize the modules required for the current page
    if (window.location.href.indexOf('/nearby-stops') > -1) {
        NearbyStopsHandler.init();
    }
    else if (window.location.href.indexOf("/stop/") > -1) {
        StopHandler.init();
        StatisticsChartHandler.init();
    }
    else if (window.location.href.indexOf("/favourites") > -1) {
        FavouritesHandler.init();
    }
});
//# sourceMappingURL=main.js.map