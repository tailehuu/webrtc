var DrawingCanvas, STATE_END, STATE_MOVE, STATE_START, config, dataChannelConfig, ref, ref1, servers,
    bind = function (fn, me) {
        return function () {
            return fn.apply(me, arguments);
        };
    };

if (((ref = Meteor.settings) != null ? (ref1 = ref["public"]) != null ? ref1.servers : void 0 : void 0) != null) {
    servers = Meteor.settings["public"].servers;
} else {
    servers = {
        iceServers: []
    };
}

config = {};

dataChannelConfig = {
    ordered: false,
    maxRetransmitTime: 0
};

STATE_START = 0;

STATE_MOVE = 1;

STATE_END = 2;

DrawingCanvas = (function () {
    function DrawingCanvas(_canvas) {
        var resize;
        this._canvas = _canvas;
        this._renderStrokes = bind(this._renderStrokes, this);
        this._ctx = this._canvas.getContext('2d');
        this._strokes = [];
        this._lastStroke = null;
        resize = (function (_this) {
            return function () {
                var height, width;
                height = window.innerHeight;
                width = window.innerWidth;
                if (height > width) {
                    height *= width / height;
                } else {
                    width *= height / width;
                }
                _this._canvas.width = width;
                return _this._canvas.height = height;
            };
        })(this);
        resize();
        $(window).resize(resize);
    }

    DrawingCanvas.prototype._getScreenX = function (relativeX) {
        return this._canvas.width * relativeX;
    };

    DrawingCanvas.prototype._getScreenY = function (relativeY) {
        return this._canvas.height * relativeY;
    };

    DrawingCanvas.prototype._renderStrokes = function () {
        var i, len, ref2, stroke;
        requestAnimationFrame(this._renderStrokes);
        if (this._strokes.length === 0) {
            return;
        }
        this._ctx.stokeStyle = '#000';
        this._ctx.beginPath();
        if (this._lastStroke != null) {
            this._ctx.moveTo(this._getScreenX(this._lastStroke.x), this._getScreenY(this._lastStroke.y));
        }
        ref2 = this._strokes;
        for (i = 0, len = ref2.length; i < len; i++) {
            stroke = ref2[i];
            this._ctx.lineTo(this._getScreenX(stroke.x), this._getScreenY(stroke.y));
            if (stroke.state = STATE_START || stroke.state === STATE_END) {
                this._lastStroke = null;
            } else {
                this._lastStroke = stroke;
            }
        }
        this._ctx.stroke();
        return this._strokes.length = 0;
    };

    DrawingCanvas.prototype.addStroke = function (stroke) {
        return this._strokes.push(stroke);
    };

    DrawingCanvas.prototype.renderStrokes = function () {
        return this._renderStrokes();
    };

    return DrawingCanvas;

})();

Template.multiDraw.rendered = function () {
    var canvas, drawingCanvas, webRTCSignaller;
    webRTCSignaller = new MultiWebRTCSignallerManager('drawing', 'master', servers, config);
    canvas = this.find('#drawing');
    drawingCanvas = new DrawingCanvas(canvas);
    drawingCanvas.renderStrokes();
    return this.autorun((function (_this) {
        return function () {
            var message, stroke;
            message = webRTCSignaller.getData();
            if (message != null) {
                stroke = JSON.parse(message);
                return drawingCanvas.addStroke(stroke);
            }
        };
    })(this));
};

Template.drawer.rendered = function () {
    var canvas, drawingCanvas, webRTCSignaller;
    this._id = Random.hexString(20);
    webRTCSignaller = SingleWebRTCSignallerFactory.create('drawing', this._id, servers, config);
    this._dataChannel = ReactiveDataChannelFactory.fromLabelAndConfig('drawing', dataChannelConfig);
    webRTCSignaller.start();
    webRTCSignaller.addDataChannel(this._dataChannel);
    webRTCSignaller.createOffer();
    canvas = this.find('#drawer');
    drawingCanvas = new DrawingCanvas(canvas);
    drawingCanvas.renderStrokes();
    this._sendEventData = (function (_this) {
        return function (event, state) {
            var ref2, stroke, x, y;
            if (((ref2 = event.originalEvent) != null ? ref2.changedTouches : void 0) != null) {
                x = event.originalEvent.changedTouches[0].pageX;
                y = event.originalEvent.changedTouches[0].pageY;
            } else {
                x = event.pageX;
                y = event.pageY;
            }
            x -= $(event.target).offset().left;
            y -= $(event.target).offset().top;
            stroke = {
                x: x / $(canvas).width(),
                y: y / $(canvas).height(),
                state: state
            };
            _this._dataChannel.sendData(JSON.stringify(stroke));
            return drawingCanvas.addStroke(stroke);
        };
    })(this);
    return $(window).on('mouseup', (function (_this) {
        return function () {
            return _this._mouseDown = false;
        };
    })(this));
};

Template.drawer.events({
    'mousedown #drawer': function (event, template) {
        template._mouseDown = true;
        return template._sendEventData(event, STATE_START);
    },
    'touchstart #drawer': function (event, template) {
        return template._sendEventData(event, STATE_START);
    },
    'mousemove #drawer': function (event, template) {
        if (template._mouseDown) {
            return template._sendEventData(event, STATE_MOVE);
        }
    },
    'touchmove #drawer': function (event, template) {
        return template._sendEventData(event, STATE_MOVE);
    },
    'mouseup #drawer': function (event, template) {
        if (template._mouseDown) {
            return template._sendEventData(event, STATE_END);
        }
    },
    'touchend #drawer': function (event, template) {
        return template._sendEventData(event, STATE_END);
    }
});