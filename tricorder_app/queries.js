//Get a list of all services that have buses on them
//Returns an array of strings
var active_services = db.locations.find().map(function(a){return a.service_name});


//Create an array of objects.  Each object has the name of the service and its array of stop coordinates

var active_service_coords = [];

active_services.forEach(function(j,k){
    if(j !== null){

        printjson(j);
        active_service_coords.push(
            {
                name: String(j),
                points: db.services.findOne({name: String(j)}).routes[0].points

            }
        );
    }
});

//Better idea: get the coordinates from each bus.  Query stops with the coordinates using near.  For each bus, if a stop is returned, check if that stop is on the buses service.

var bus_coords = db.locations.find().map(function(a){return {service_name: a.service_name, coordinates: a.coordinates, vehicle_id: a.vehicle_id, last_gps_fix: a.last_gps_fix}});

var busses_near_stops = [];

bus_coords.forEach(function(j,k) {
    //Making sure it returns 1 stop now because I don't know proper distance
//	print(j);
    var stop = db.stops.findOne({
        coordinates: { $near : j.coordinates, $maxDistance: .00001}
    });
//	print(stop);
    if(stop !== null && j.service_name !== null) {
        var service_name_of_bus = j.service_name;

        var service_of_name = db.services.findOne({name: service_name_of_bus});
        //	printjson(service_of_name);
        if(service_of_name.routes[0].stops.indexOf(stop.stop_id) > -1) {

            busses_near_stops.push(
                {
		    time: j.last_gps_fix,
                    bus_coords: j.coordinates,
                    stop_coords: stop.coordinates,
                    vehicle_id: j.vehicle_id,
                    stop_id: stop.stop_id,
                    service_name: service_name_of_bus
                });
        }
    }

});

//For each element in busses_near_stops, I want to compare the current time to the time that the bus is supposed to be at that stop, using Journeys
busses_near_stops.forEach(function(j,k){
    var journey = db.journeys.find({service_name: j.service_name});
    var departures = journey.departures;
    for(var i = 0; i < departures.length; i++) {
	var curDeparture = departures[i];
	if(curDeparture.stop_id === j.stop_id) {
	    var vehicleStat = db.vehiclestats.find({vehicle_id : j.vehicle_id});
	    var stopStat = db.stopstats.find({stop_id : j.stop_id});

	    var journeyTime = moment.(curDeparture.time, 'HH:mm');
	    
	    var timeDif = j.time - journeyTime;
	    
	    var minutesDif = timeDif / 60000;

	    if(minutesDif < 5) {
		stopStat.early_5_plus++;
		vehicleStat.early_5_plus++;
	    }

	    else if(minutesDif > 4 && minutesDif < 3) {
		stopStat.early_4++;
		vehicleStat.early_4++;
	    }

	    else if(minutesDif > 3 && minutesDif < 2) {
		stopStat.early_3++;
		vehicleStat.early_3++;
	    }
	    
	    else if(minutesDif > 2 && minutesDif < 1) {
		stopStat.early_2++;
		vehicleStat.early_2++;
	    }

	    else if(minutesDif < 2 && minutesDif > 1) {
		stopStat.late_2++;
		vehicleStat.late_2++;
	    }

	    else if(minutesDif < 3 && minutesDif > 2) {
		stopStat.late_3++;
		vehicleStat.late_3++;
	    }
	    
	    else if(minutesDif < 4 && minutesDif > 3) {
		stopStat.late_4++;
		vehicleStat.late_4++;
	    }

	    else if(minutesDif > 5) {
		stopStat.late_5_plus++;
		vehicleStat.late_5_plus++;
	    }
	    
	}
    }
    
});
