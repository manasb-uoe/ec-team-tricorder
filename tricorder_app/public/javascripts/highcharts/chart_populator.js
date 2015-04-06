/**
 * Created by angel on 06/04/15.
 */
//var util = require('../../../utilities/util');
//var index = require('../../../routes/index');

//var api_stop = util.urls.api_stop;
//var stop_id = index.stop.stop_id;
//var period = period;
$(function (vehicle_id) {
    $.ajax({
        url: "/api/vehicle/" + "?id=" + 204 + "&period=" + "daily",
        type: "GET",
        dataType: "json",
        success: function (json) {
            console.log(JSON.stringify(json));


            $('#chart').highcharts({
                chart: {
                    type: 'column'
                },
                title: {
                    text: 'Stop statistics'
                },
                xAxis: {
                    type: 'category',
                    labels: {
                        rotation: -45,
                        style: {
                            fontSize: '13px',
                            fontFamily: 'Verdana, sans-serif'
                        }
                    }
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'Population (millions)'
                    }
                },
                legend: {
                    enabled: false
                },
                tooltip: {
                    pointFormat: 'Population in 2008: <b>{point.y:.1f} millions</b>'
                },
                series: [{
                    name: 'Population',
                    data: [
                        ['Early by more than 10 min', 23.7],
                        ['Early by 10 min', 16.1],
                        ['Early by 9 min', 14.2],
                        ['Early by 8 min', 14.0],
                        ['Early by 7 min', 12.5],
                        ['Early by 6 min', 12.1],
                        ['Early by 4 min', 11.8],
                        ['Early by 3 min', 11.7],
                        ['Early by 2 min', 11.1],
                        ['On time', 11.1],
                        ['Late by 2 min', 10.5],
                        ['Late by 3 min', 10.4],
                        ['Late by 4 min', 10.0],
                        ['Late by 5 min', 9.3],
                        ['Late by 6 min', 9.3],
                        ['Late by 7 min', 9.0],
                        ['Late by 8 min', 8.9],
                        ['Late by 9 min', 8.9],
                        ['Late by 10 min', 8.9],
                        ['Late by more than', 8.9]
                    ],
                    dataLabels: {
                        enabled: true,
                        rotation: -90,
                        color: '#FFFFFF',
                        align: 'right',
                        format: '{point.y:.1f}', // one decimal
                        y: 10, // 10 pixels down from the top
                        style: {
                            fontSize: '13px',
                            fontFamily: 'Verdana, sans-serif'
                        }
                    }
                }]
            });
        }
    })


});