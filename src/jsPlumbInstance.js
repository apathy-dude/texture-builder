var instance = jsPlumb.getInstance({
    Container: 'wrapper',
    Connector: [ 'Bezier', { curviness: 1 } ],
    Anchors: [ 'Right', [ 0, 0.5, 0, 1 ] ],
    ConnectionOverlays: [
        [ 'Arrow', { location: 1 } ]
    ]
});

module.exports = instance;
