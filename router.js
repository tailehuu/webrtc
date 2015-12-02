var FIRST, SECOND, THIRD, getRandomRoomName;

FIRST = 'abcdefghijklmnopqrstuvwxyz';

SECOND = 'aeiou';

THIRD = FIRST;

getRandomRoomName = function () {
    var i, len, parts, ref, wordArray;
    parts = [];
    ref = [FIRST, SECOND, THIRD];
    for (i = 0, len = ref.length; i < len; i++) {
        wordArray = ref[i];
        parts.push(Random.choice(wordArray));
    }
    return parts.join('');
};

Router.configure({
    layoutTemplate: 'layout'
});

Router.map(function () {
    this.route('root', {
        where: 'server',
        path: '/',
        action: function () {
            var newName;
            newName = getRandomRoomName();
            this.response.writeHead(307, {
                Location: Router.path('home', {
                    roomName: newName
                })
            });
            return this.response.end();
        }
    });

    this.route('imageRoot', {
        where: 'server',
        path: '/image-stream',
        action: function () {
            var newName;
            newName = getRandomRoomName();
            this.response.writeHead(307, {
                Location: Router.path('ImageStream', {
                    roomName: newName
                })
            });
            return this.response.end();
        }
    });

    this.route('multiDraw', {
        path: '/multi_draw'
    });

    this.route('drawer', {
        path: '/drawer'
    });

    this.route('home', {
        path: '/:roomName'
    });

    this.route('ImageStream', {
        path: '/image-stream/:roomName'
    });
});