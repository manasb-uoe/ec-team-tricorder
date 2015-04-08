/**
 * Created by angel on 06/04/15.
 */
var currentStop = window.location.pathname.slice(-8);

$(document).ready(function(){
    $("#bus-chart").hide();
    stopChartGenerator(currentStop);
    $('.bus-container').click(function(){
        $("#stop-chart").hide();
        var bus_id_chart_raw = $(this).find('.title').text();
        var tmp = bus_id_chart_raw.substring(5,8);
        var bus_id_chart = tmp.replace(' ', '');
        $("#bus-chart").show();
        busChartGenerator(bus_id_chart);
    })
})

function busChartGenerator(bus_id_chart){
        $.ajax({
            url: "/api/vehicle/" + "?id=" + bus_id_chart + "&period=" + "daily",
            type: "GET",
            dataType: "json",
            success: function (json) {
                $('#bus-chart').highcharts({
                    chart: {
                        type: 'column'
                    },
                    title: {
                        text: 'Bus statistics for bus '+ bus_id_chart
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
}

function stopChartGenerator(currentStop){
    $.ajax({
        url: "/api/stop/" + "?id=" + currentStop + "&period=" + "daily",
        type: "GET",
        dataType: "json",
        success: function (json) {
            $('#stop-chart').highcharts({
                chart: {
                    type: 'column'
                },
                title: {
                    text: 'Statistics for bus stop '+ currentStop
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
}
