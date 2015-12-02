var allowAll;

allowAll = function () {
    return true;
};

share.stream.permissions.read(allowAll);

share.stream.permissions.write(allowAll);