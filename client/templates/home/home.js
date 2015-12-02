Session.set('hasWebRTC', false);

Template.home.created = function () {
    var dataChannel, dataChannelConfig, hasWebRTC, mediaConfig, ref, ref1, roomName, rtcPeerConnectionConfig, servers, videoConfig, webRTCSignaller;
    if (((ref = Meteor.settings) != null ? (ref1 = ref["public"]) != null ? ref1.servers : void 0 : void 0) != null) {
        servers = Meteor.settings["public"].servers;
    } else {
        servers = {
            iceServers: []
        };
    }
    rtcPeerConnectionConfig = {};
    dataChannelConfig = {};
    videoConfig = {
        mandatory: {
            maxWidth: 320,
            maxHeight: 240
        }
    };
    mediaConfig = {
        video: true,
        audio: true
    };
    webRTCSignaller = null;
    dataChannel = null;
    roomName = Router.current().params.roomName;
    Session.set('roomName', roomName);
    hasWebRTC = false;
    if (typeof RTCPeerConnection !== "undefined" && RTCPeerConnection !== null) {
        this._webRTCSignaller = SingleWebRTCSignallerFactory.create(share.stream, roomName, 'master', servers, rtcPeerConnectionConfig, mediaConfig);
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

Template.home.destroyed = function () {
    return this._webRTCSignaller.stop();
};

Template.home.helpers({
    roomName: function () {
        var roomName;
        roomName = Session.get('roomName');
        if (roomName) {
            return Meteor.absoluteUrl(Router.path('home', {
                roomName: roomName
            }).slice(1));
        }
    },
    localStream: function () {
        if (!Session.get('hasWebRTC')) {
            return;
        }
        return Template.instance()._webRTCSignaller.getLocalStream();
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
    canSend: function () {
        if (!Session.get('hasWebRTC')) {
            return 'disabled';
        }
        if (!dataChannel.isOpen()) {
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
    }
});

Template.home.events({
    'click [name="call"]': function (event, template) {
        event.preventDefault();
        if (template._webRTCSignaller == null) {
            return;
        }
        return template._webRTCSignaller.createOffer();
    }
});