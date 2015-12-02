Session.set('hasWebRTC', false);

Template.ImageStream.created = function () {
    var config, dataChannel, hasWebRTC, mediaConfig, ref, ref1, servers, signallingChannelName, videoConfig;
    this._imageStreamer = new ImageStreamer();
    this._imageVideoUserMediaGetter = new ImageVideoUserMediaGetter();
    if (((ref = Meteor.settings) != null ? (ref1 = ref["public"]) != null ? ref1.servers : void 0 : void 0) != null) {
        servers = Meteor.settings["public"].servers;
    } else {
        servers = {
            iceServers: []
        };
    }
    config = {};
    videoConfig = {
        mandatory: {
            maxWidth: 320,
            maxHeight: 240
        }
    };
    mediaConfig = {
        video: videoConfig,
        audio: false
    };
    dataChannel = null;
    signallingChannelName = Router.current().url;
    Session.set('roomName', Router.current().params.roomName);
    hasWebRTC = false;
    if (typeof RTCPeerConnection !== "undefined" && RTCPeerConnection !== null) {
        this._webRTCSignaller = SingleWebRTCSignallerFactory.create(share.stream, signallingChannelName, 'master', servers, config, mediaConfig);
        hasWebRTC = true;
    } else {
        console.error('No RTCPeerConnection available :(');
    }
    Session.set('hasWebRTC', hasWebRTC);
    if (!hasWebRTC) {
        return;
    }
    return this._webRTCSignaller.start();
};

Template.ImageStream.rendered = function () {
    var dataChannel, dataChannelConfig;
    dataChannelConfig = {};
    dataChannel = ReactiveDataChannelFactory.fromLabelAndConfig('test', dataChannelConfig);
    this._webRTCSignaller.addDataChannel(dataChannel);
    this._imageVideoUserMediaGetter.start();
    this._imageStreamer.init(dataChannel, this.find('#local-stream'), this.find('#image-stream'));
    return this._imageStreamer.start();
};

Template.ImageStream.destroyed = function () {
    console.log('stopping');
    this._imageStreamer.stop();
    this._imageVideoUserMediaGetter.stop();
    return this._webRTCSignaller.stop();
};

Template.ImageStream.helpers({
    roomName: function () {
        var roomName;
        roomName = Session.get('roomName');
        if (roomName) {
            return Meteor.absoluteUrl(Router.path('ImageStream', {
                roomName: roomName
            }).slice(1));
        }
    },
    localStream: function () {
        var imageVideoUserMediaGetter;
        imageVideoUserMediaGetter = Template.instance()._imageVideoUserMediaGetter;
        return imageVideoUserMediaGetter.getStreamUrl();
    },
    remoteStream: function () {
        if (!Session.get('hasWebRTC')) {
            return;
        }
        return Template.instance()._webRTCSignaller.getRemoteStream();
    },
    canCall: function () {
        var webRTCSignaller;
        if (!Session.get('hasWebRTC')) {
            return 'disabled';
        }
        webRTCSignaller = Template.instance()._webRTCSignaller;
        if (!(webRTCSignaller.started() && !webRTCSignaller.inCall() && !webRTCSignaller.waitingForResponse() && !webRTCSignaller.waitingToCreateAnswer())) {
            return 'disabled';
        }
    },
    callText: function () {
        var webRTCSignaller;
        if (!Session.get('hasWebRTC')) {
            return "Your browser doesn't suuport Web RTC :(";
        }
        webRTCSignaller = Template.instance()._webRTCSignaller;
        if (webRTCSignaller.waitingForUserMedia()) {
            return 'Waiting for you to share your camera';
        }
        if (webRTCSignaller.waitingForResponse()) {
            return 'Waiting for response';
        }
        if (webRTCSignaller.waitingToCreateAnswer()) {
            return 'Someone is calling you';
        }
        return 'Begin call with the other person in the room';
    },
    imageQuality: function () {
        var imageStreamer;
        imageStreamer = Template.instance()._imageStreamer;
        return imageStreamer.getQuality();
    },
    imageWidth: function () {
        var imageStreamer;
        imageStreamer = Template.instance()._imageStreamer;
        return imageStreamer.getWidth();
    },
    imageHeight: function () {
        var imageStreamer;
        imageStreamer = Template.instance()._imageStreamer;
        return imageStreamer.getHeight();
    },
    dataChannelFps: function () {
        var imageStreamer;
        imageStreamer = Template.instance()._imageStreamer;
        return imageStreamer.getFps();
    },
    localImageSrc: function () {
        var imageStreamer;
        imageStreamer = Template.instance()._imageStreamer;
        return imageStreamer.getLocalImageDataUrl();
    },
    localImageKB: function () {
        var bytesLength, imageStreamer;
        imageStreamer = Template.instance()._imageStreamer;
        bytesLength = imageStreamer.getLocalImageByteLength();
        return (bytesLength / 1000).toFixed(2);
    },
    localImageKBps: function () {
        var bytesPerSecond, imageStreamer;
        imageStreamer = Template.instance()._imageStreamer;
        bytesPerSecond = imageStreamer.getLocalImageBytesPerSecond();
        return (bytesPerSecond / 1000).toFixed(2);
    },
    localImageKbps: function () {
        var bytesPerSecond, imageStreamer;
        imageStreamer = Template.instance()._imageStreamer;
        bytesPerSecond = imageStreamer.getLocalImageBytesPerSecond();
        return (bytesPerSecond * 8 / 1000).toFixed(2);
    },
    imageSrc: function () {
        var imageStreamer;
        imageStreamer = Template.instance()._imageStreamer;
        if (imageStreamer.ready()) {
            return imageStreamer.getOtherVideo();
        }
    }
});

Template.ImageStream.events({
    'click [name="call"]': function (event) {
        var webRTCSignaller;
        event.preventDefault();
        webRTCSignaller = Template.instance()._webRTCSignaller;
        if (webRTCSignaller == null) {
            return;
        }
        return webRTCSignaller.createOffer();
    },
    'input #image-quality': function (event, template) {
        event.preventDefault();
        return template._imageStreamer.setQuality(parseFloat($(event.target).val()));
    },
    'input #image-width': function (event, template) {
        event.preventDefault();
        return template._imageStreamer.setWidth(parseFloat($(event.target).val()));
    },
    'input #image-height': function (event, template) {
        event.preventDefault();
        return template._imageStreamer.setHeight(parseFloat($(event.target).val()));
    },
    'input #data-channel-fps': function (event, template) {
        event.preventDefault();
        return template._imageStreamer.setFps(parseFloat($(event.target).val()));
    }
});