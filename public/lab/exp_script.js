$('head').append('<link rel="stylesheet" href="http://relle.ufsc.br/css/shepherd-theme-arrows.css" type="text/css"/>');

var rpi_server = "http://150.162.233.11";
var start = 0;
var step = 1;
var lab_socket = null;
var readings = [];
var chart = {
    type: 'line',
    data: {
        datasets: [{
            label: lang.label1,
            data: [],
            backgroundColor: "rgba(75,192,192,0.4)"
        }],
        xLabels: [lang.time],
        yLabels: [lang.temperature],
        labels: [lang.temperature]
    },
    options: {
        scales: {
            xAxes: [{
                type: 'linear',
                position: 'bottom'
            }]
        }
    }
};

function init_chart() {
    var ctx = document.getElementById("canvas").getContext("2d");
    if (typeof(window.myLine) != 'undefined') window.myLine.destroy();
    window.myLine = new Chart(ctx, chart);
}

function update_chart(temp) {
    window.myLine.data.datasets[0].data.push({
        x: start,
        y: temp
    })
    window.myLine.update();
    start = start + step;
}

$(function() {
    $('.switch').bootstrapToggle({
        onstyle: "success",
        offstyle: "danger",
        size: "small"
    });

    $('#onOff').change(function() {
        if ($(this).prop('checked')) {
            lab_socket.emit('start', {
                setpoint: $('#setPoint').val()
            })
            window.myLine.data.datasets[0].data = [];
            init_chart();
        } else {
            lab_socket.emit('stop', {
                stopTempStreaming: true
            });
        }
    })


    $('#scale').change(function() {
        var obj = {};
        obj.scale = $(this).prop('checked') ? 'fahrenheit' : 'celsius';

        if (lab_socket) lab_socket.emit('scale', obj)

    })

    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.2.2/Chart.min.js', function() {
        init_chart();
    });

    $.ajax({
        url: rpi_server + '/socket.io/socket.io.js',
        dataType: "script",
        timeout: 10 * 1000
    }).done(function() {
        initLabServerCom();
    }).fail(function() {
        initLabServerCom();
    });


    function refreshWebCam(address) {
        $('.cam').attr('src', address + '/snapshot.jpg?' + Math.floor((Math.random() * 1000)));
    }

    function initLabServerCom(rpi_server_address) {
        if (typeof(rpi_server_address) != 'undefined') {
            console.log(rpi_server_address);
            lab_socket = io.connect(rpi_server_address.url, {
                path: rpi_server_address.path + '/socket.io'
            });
            setInterval(function() {
                refreshWebCam(rpi_server_address.url + rpi_server_address.path);
            }, 1000);
        } else {
            lab_socket = io.connect(rpi_server);
        }

        lab_socket.emit('new connection', {
            pass: $('meta[name=csrf-token]').attr('content')
        });

        lab_socket.on('reconnect', function() {
            lab_socket.emit('new connection', {
                pass: $('meta[name=csrf-token]').attr('content')
            });
        });

        lab_socket.on('temperature', function(data) {
            console.log(data);
            update_chart(data.meanValue);
            readings.push(data.meanValue);
        });

        lab_socket.on('scale', function(data) {
            console.log(data);
        });

        $.getScript('/lab/welcome.js', function() {
            var shepherd = setupShepherd();
            addShowmeButton('<button id="btnIntro" class="btn btn-sm btn-default"> <span class="long">' + lang.showme + '</span><span class="short">' + lang.showmeshort + '</span> <span class="how-icon fui-question-circle"></span></button>')
            $('#btnIntro').on('click', function(event) {
                event.preventDefault();
                shepherd.start();
            });
        });
    }
});


function exportcsv() {
    console.log("CSV data...");
    var data = [];     
    for (var i = 0; i < readings.length; i++) {  
        data.push({
            time: i * step,
            temperature: readings[i]
        });  
    }
    $.redirect('http://150.162.233.11/export/',data, "POST","_blank",false);
}