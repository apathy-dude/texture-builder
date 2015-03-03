module.exports = {
    source: {
        isSource: true,
        maxConnections: -1,
        endpoint: 'Dot',
        anchor: 'Right'
    },
    target: {
        isTarget: true,
        endPoint: 'Dot'
    },
    targetTop: {
        anchor: [ 0, 1/3, 0, 0 ]
    },
    targetBottom: {
        anchor: [ 0, 2/3, 0, 0 ]
    },
    targetMid: {
        anchor: 'Left'
    }
};
