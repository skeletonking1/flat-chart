var endpointList = [];
var sourcepointList = [];
var _saveFlowchart, _loadFlowChart, elementCount = 0;
var jsPlumbInstance; //the jsPlumb jsPlumbInstance
var properties = []; //keeps the properties of each element

var con_style;
var con_color = "#61B7CF";
var con_tick = 2;

var selected;
jsPlumb.ready(function () {
    var element = "";   //the element which will be appended to the canvas
    var clicked = false;    //check whether an element from the palette was clicked

    jsPlumbInstance = window.jsp = jsPlumb.getInstance({
        // default drag options
        DragOptions: {
            cursor: 'pointer',
            zIndex: 2000
        },
        //the arrow overlay for the connection
        ConnectionOverlays: [
            ["Arrow", {
                location: 1,
                visible: true,
                id: "ARROW"
            }]
        ],
        Container: "canvas"
    });

    //define basic connection type
    var basicType = {
        connector: "StateMachine",
        paintStyle: { strokeStyle: con_color, lineWidth: con_tick },
        hoverPaintStyle: { strokeStyle: "blue" }
    };
    jsPlumbInstance.registerConnectionType("basic", basicType);

    //style for the connector
    var connectorPaintStyle = {
        lineWidth: con_tick,
        strokeStyle: con_color,
        joinstyle: "round",
        outlineColor: "white",
        outlineWidth: 1
    },

        //style for the connector hover
        connectorHoverStyle = {
            lineWidth: con_tick,
            // strokeStyle: "#216477",
            outlineWidth: 1,
            outlineColor: "white"
        },
        endpointHoverStyle = {
            // fillStyle: "#216477",
            // strokeStyle: "#216477"
        },

        //the source endpoint definition from which a connection can be started
        sourceEndpoint = {
            endpoint: "Dot",
            paintStyle: {
                strokeStyle: "#7AB02C",
                fillStyle: "transparent",
                radius: 7,
                lineWidth: 3
            },
            isSource: true,
            connector: ["Flowchart", { stub: [40, 60], gap: 5, cornerRadius: 5, alwaysRespectStubs: true }],
            connectorStyle: connectorPaintStyle,
            // hoverPaintStyle: endpointHoverStyle,
            // connectorHoverStyle: connectorHoverStyle,
            EndpointOverlays: [],
            maxConnections: -1,
            dragOptions: {},
            connectorOverlays: [
                ["Arrow", {
                    location: 1,
                    visible: true,
                    id: "ARROW",
                    direction: 1
                }]
            ]
        },

        //definition of the target endpoint the connector would end
        targetEndpoint = {
            endpoint: "Dot",
            paintStyle: { fillStyle: "#7AB02C", radius: 9 },
            maxConnections: -1,
            dropOptions: { hoverClass: "hover", activeClass: "active" },
            hoverPaintStyle: endpointHoverStyle,
            isTarget: true
        };

    function makeDraggable(id, className, text) {
        $(id).draggable({
            helper: function () {
                return $("<div/>", {
                    text: text,
                    class: className
                });
            },
            stack: ".custom",
            revert: false
        });
    }

    makeDraggable("#descEv", "window diamond jsplumb-connected-desc custom", "Question");
    makeDraggable("#stepEv", "window step jsplumb-connected-step custom", "Action");
    makeDraggable("#endEv", "window step jsplumb-connected-end custom", "Output");

    $("#descEv").draggable({
        helper: function () {
            return createElement("");
        },
        stack: ".custom",
        revert: false
    });

    //make the editor canvas droppable
    $("#canvas").droppable({
        accept: ".window",
        drop: function (event, ui) {
            if (clicked) {
                clicked = false;
                elementCount++;
                var name = "Window" + elementCount;
                var id = "flowchartWindow" + elementCount;
                element = createElement(id, name);
                drawElement(element, "#canvas", name);
                element = "";
            }
        }
    });

    //take the x, y coordinates of the current mouse position
    var x, y;
    $(document).on("mousemove", function (event) {
        x = event.pageX;
        y = event.pageY;
        if (clicked) {
            properties[0].top = y - 100;
            properties[0].left = x - 300;
        }
    });

    var properties;
    var clicked = false;
    function loadProperties(clsName, left, top, label, startpoints, endpoints, contenteditable) {
        properties = [];
        properties.push({
            left: left,
            top: top,
            clsName: clsName,
            label: label,
            startpoints: startpoints,
            endpoints: endpoints,
            contenteditable: contenteditable
        });
    }

    $('#stepEv').mousedown(function () {
        loadProperties("window step custom jtk-node jsplumb-connected-step", "5em", "5em", "Action",
            ["BottomCenter"], ["TopCenter"], true);
        clicked = true;
    });


    $('#descEv').mousedown(function () {
        loadProperties("window diamond custom jtk-node jsplumb-connected-desc", "5em", "5em", "Question",
            ["LeftMiddle", "RightMiddle", "BottomCenter"], ["TopCenter"], true, 100, 100);
        clicked = true;
    });


    $('#endEv').mousedown(function () {
        loadProperties("window step custom jtk-node jsplumb-connected-end", "5em", "5em", "Output",
            [], ["TopCenter"], true);
        clicked = true;
    });

    //create an element to be drawn on the canvas
    function createElement(id, name) {
        var elm = $('<div>').addClass(properties[0].clsName).attr('id', id).attr('name', name);
        if (properties[0].clsName.indexOf("diamond") > -1) {
            elm.outerWidth("100px");
            elm.outerHeight("100px");
        }
        elm.css({
            'top': properties[0].top,
            'left': properties[0].left
        });

        var strong = $('<strong>');
        if (properties[0].clsName == "window diamond custom jtk-node jsplumb-connected-desc") {
            elm.append("<i style='display: none; margin-left: -5px; margin-top: -50px' " +
                "class=\"fa fa-trash fa-lg close-icon desc-text\"><\/i>");
            let p = "<p style='line-height: 110%; ; margin-top: 35px' class='desc-text' contenteditable='true' " +
                "ondblclick='$(this).focus();'>" + properties[0].label + "</p>";
            strong.append(p);
        }
        else if (properties[0].clsName == "window parallelogram step custom jtk-node jsplumb-connected-step") {
            elm.append("<i style='display: none' class=\"fa fa-trash fa-lg close-icon input-text\"><\/i>");
            var p = "<p style='line-height: 110%; margin-top: 25px' class='input-text' contenteditable='true' " +
                "ondblclick='$(this).focus();'>" + properties[0].label
                + "</p>";
            strong.append(p);
        }

        else if (properties[0].contenteditable) {
            elm.append("<i style='display: none' class=\"fa fa-trash fa-lg close-icon\"><\/i>");
            var p = "<p style='line-height: 110%; margin-top: 25px' contenteditable='true' " +
                "ondblclick='$(this).focus();'>" + properties[0].label + "</p>";
            strong.append(p);
        } else {
            elm.append("<i style='display: none' class=\"fa fa-trash fa-lg close-icon\"><\/i>");
            var p = $('<p>').text(properties[0].label);
            strong.append(p);
        }
        elm.append(strong);
        return elm;
    }

    //add the endpoints for the elements
    var ep;
    var _addEndpoints = function (toId, sourceAnchors, targetAnchors) {
        for (var i = 0; i < sourceAnchors.length; i++) {
            var sourceUUID = toId + sourceAnchors[i];
            ep = jsPlumbInstance.addEndpoint("flowchart" + toId, sourceEndpoint, {
                anchor: sourceAnchors[i], uuid: sourceUUID
            });
            sourcepointList.push(["flowchart" + toId, ep]);
            ep.canvas.setAttribute("title", "Drag a connection from here");
            ep = null;
        }
        for (var j = 0; j < targetAnchors.length; j++) {
            var targetUUID = toId + targetAnchors[j];
            ep = jsPlumbInstance.addEndpoint("flowchart" + toId, targetEndpoint, {
                anchor: targetAnchors[j], uuid: targetUUID
            });
            endpointList.push(["flowchart" + toId, ep]);
            ep.canvas.setAttribute("title", "Drop a connection here");
            ep = null;
        }
    };

    function getEndpoints(elementType) {
        switch (elementType) {
            case "Action": return [["BottomCenter"], ["TopCenter"]];
            case "Question": return [["LeftMiddle", "RightMiddle", "BottomCenter"], ["TopCenter"]];
            case "Output": return [[], ["TopCenter"]];
        }
    }

    function drawElement(element, canvasId, name) {
        $(canvasId).append(element);
        _addEndpoints(name, properties[0].startpoints, properties[0].endpoints);
        jsPlumbInstance.draggable(jsPlumbInstance.getSelector(".jtk-node"), {
            grid: [20, 20]
        });
    }


    $(document).on("click", ".custom", function () {
        if ($(this).attr("class").indexOf("diamond") == -1) {
            var marginLeft = $(this).outerWidth() + "px";
            $(".close-icon").prop("title", "Delete the element");
            $(this).find("i").css({ 'margin-left': marginLeft, 'margin-top': "-10px", 'display': "block" }).show();
        } else {
            $(this).find("i").css({ 'margin-left': "35px", 'margin-top': "-30px", 'display': "block" }).show();
        }
    });

    $('#canvas').on('click', function (e) {
        $(".jtk-node").css({ 'outline': "none" });
        $(".close-icon").hide();
        if (e.target.nodeName == "P") {
            e.target.parentElement.parentElement.style.outline = "4px solid red";
        } else if (e.target.nodeName == "STRONG") {
            e.target.parentElement.style.outline = "4px solid red";
        } else if (e.target.getAttribute("class") != null && e.target.getAttribute("class").indexOf("jtk-node") > -1) {//when clicked the step, decision or i/o elements
            e.target.style.outline = "4px solid red";
        }

    });


    function rgb2hex(orig) {
        var rgb = orig.replace(/\s/g, '').match(/^rgba?\((\d+),(\d+),(\d+)/i);
        return (rgb && rgb.length === 4) ? "#" +
            ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
            ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
            ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) : orig;
    }

    $('#canvas').on('dblclick', function (e) {

        if (e.target.nodeName == "DIV" && e.target.className.indexOf("window") == 0) {
            selected = e.target;
            $("#styledFormat").css({ 'display': "box" }).show();
            $("#bgColor").val(rgb2hex($(selected).css('background-color')));
            $("#styledFormat #text").text($('p', $(selected)).text());
            $("#styledFormat #style_choice").val($(selected).css('border-style'));
            $("#styledFormat #lineColor").val(rgb2hex($(selected).css('border-color')));
            let tick = $(selected).css('border-width') >= '2px'? "thick" : "thin";
            $("#styledFormat #tick_choice").val(tick);
            $("#fontColor").val(rgb2hex($('p', $(selected)).css('color')));
        }
        else if (e.target.nodeName == "path") {
            selected = e.target;
            $("#connectionFormat").css({ 'display': "box" }).show();
            let tick = con_tick == '2px'? "thick" : "thin";
            $("#connectionFormat #tick_choice").val(tick);
            $("#connectionFormat #lineColor").val(con_color);
        }
        else
            return;
    });

    $(document).on("click", ".close-icon", function () {
        selected = $(this).parent().attr("id");
        $("#confirmDelete").css({ 'display': "box" }).show();
    });

    $(document).on("click", ".close", function () {
        $("#confirmDelete").hide();
        $("#connectionFormat").hide();
        $("#styledFormat").hide();
        if ($(this).context.parentElement.parentElement.parentElement.id === "confirmDelete") $(document).find("i").hide()
        selected = null;
    });
    $(document).on("click", ".closeBtn", function () {
        $("#confirmDelete").hide();
        $("#connectionFormat").hide();
        $("#styledFormat").hide();
        if ($(this).context.parentElement.parentElement.parentElement.id === "confirmDelete") $(document).find("i").hide()
        selected = null;
    });

    $(document).on("click", ".confirmBtn", function () {

        if ($(this).context.parentElement.parentElement.parentElement.id === "confirmDelete") {
            jsPlumbInstance.remove(selected);
            $("#confirmDelete").hide();
        }
        else if ($(this).context.parentElement.parentElement.parentElement.id === "connectionFormat") {
            
            let tick = $("#connectionFormat #tick_choice").val();
            con_tick = tick == "thin" ? 2 : 4; 
            con_color= rgb2hex( $("#connectionFormat #lineColor").val());
            $(selected).css({ 'stroke': con_color, 'stroke-width': con_tick });
            $("#connectionFormat").hide();
            selected = null;

        }
        else {

            let bgColor = $("#bgColor").val();
            let lineStyle = $("#styledFormat #style_choice").val();
            let lineColor = $("#styledFormat #lineColor").val();
            let lineTick = $("#styledFormat #tick_choice").val();
            let fontColor = $("#fontColor").val();

            $(selected).css({ 'background-color': bgColor, 'border-color': lineColor, 'border-style': lineStyle, 'border-width': lineTick });
            $('p', $(selected)).css({ 'color': fontColor });
            $("#styledFormat").hide();
            selected = null;

        }

    });
});