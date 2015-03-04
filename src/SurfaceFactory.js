var gamejs = require('gamejs');
var voronoiGenerator = require('voronoi-diagram');
var g = gamejs.graphics;
var Surface = g.Surface;
var SurfaceArray = g.SurfaceArray;
var random = gamejs.math.random;

function noise() {
    var width,
        height,
        seed,
        rand,
        minR,
        minG,
        minB,
        minA,
        maxR,
        maxG,
        maxB,
        maxA,
        surface;

    var defaults = {
        min: 0,
        max: 255,
        seed: 0
    };

    if(arguments.length === 6) {
        if(arguments[4] instanceof Array && arguments[5] instanceof Array && arguments[4].length >= 3 && arguments[5].length >= 3) {
            surface = arguments[0];
            width = arguments[1];
            height = arguments[2];
            seed = arguments[3];
            minR = arguments[4][0];
            minG = arguments[4][1];
            minB = arguments[4][2];
            maxR = arguments[5][0];
            maxG = arguments[5][1];
            maxB = arguments[5][2];

            if(arguments[4].length > 3)
                minA = arguments[4][3];

            if(arguments[5].length > 3)
                maxA = arguments[5][3];
        }
        else {
            throw new Error('Improper arguments for noise surface');
        }
    }
    else if(arguments.length === 5) {
        surface = arguments[0];
        if(arguments[1] instanceof Array) {
            width = arguments[1][0];
            height = arguments[1][1];
            seed = arguments[2];
        }
        else {
            width = arguments[1];
            height = arguments[2];
        }

        if(arguments[3] instanceof Array && arguments[4] instanceof Array && arguments[3].length >= 3 && arguments[4].length >= 3) {
            minR = arguments[3][0];
            minG = arguments[3][1];
            minB = arguments[3][2];
            maxR = arguments[4][0];
            maxG = arguments[4][1];
            maxB = arguments[4][2];

            if(arguments[3].length > 3)
                minA = arguments[3][3];

            if(arguments[4].length > 3)
                maxA = arguments[4][3];
        }
        else {
            throw new Error('Improper arguments for noise surface');
        }
    }
    else if(arguments.length === 4) {
        surface = arguments[0];
        if(arguments[1] instanceof Array) {
            width = arguments[1][0];
            height = arguments[1][1];
        }
        else {
            throw new Error('Improper arguments for noise surface');
        }

        if(arguments[2] instanceof Array && arguments[3] instanceof Array && arguments[2].length >= 3 && arguments[3].length >= 3) {
            minR = arguments[2][0];
            minG = arguments[2][1];
            minB = arguments[2][2];
            maxR = arguments[3][0];
            maxG = arguments[3][1];
            maxB = arguments[3][2];

            if(arguments[2].length > 3)
                minA = arguments[2][3];

            if(arguments[3].length > 3)
                maxA = arguments[3][3];
        }
        else {
            throw new Error('Improper arguments for noise surface');
        }
    }
    else {
        throw new Error('Improper arguments for noise surface');
    }

    minR = minR || defaults.min;
    minG = minG || defaults.min;
    minB = minB || defaults.min;
    minA = minA || defaults.min;

    maxR = maxR || maxR === 0 ? maxR : defaults.max;
    maxG = maxG || maxG === 0 ? maxG : defaults.max;
    maxB = maxB || maxB === 0 ? maxB : defaults.max;
    maxA = maxA || maxA === 0 ? maxA : defaults.max;

    seed = seed || defaults.seed;

    rand = random.Alea(seed);

    surface = new SurfaceArray([width, height]);

    var xPos, yPos, r, g, b, a;
    if(minR === maxR)
        r = minR;
    if(minG === maxG)
        g = minG;
    if(minB === maxB)
        b = minB;
    if(minA === maxA)
        a = minA;
    for(xPos = 0; xPos < width; xPos++) {
        for(yPos = 0; yPos < height; yPos++) {
            if(minR !== maxR)
                r = rand.integer(minR, maxR);
            if(minG !== maxG)
                g = rand.integer(minG, maxG);
            if(minB !== maxB)
                b = rand.integer(minB, maxB);
            if(minA !== maxA)
                a = rand.integer(minA, maxA);
            surface.set(xPos, yPos, [r, g, b, a]);
        }
    }

    return surface.surface;
}

function relative() {
    var width,
        height,
        color,
        source,
        sourceInfo,
        callback,
        surface;

    if(arguments.length === 3) {
        source = arguments[0];
        color = arguments[1];
        callback = arguments[2];
    }
    else {
        throw new Error('Improper arguments for relative surface');
    }

    width = source.getSize()[0];
    height = source.getSize()[1];
    sourceInfo = new SurfaceArray(source);
    surface = new SurfaceArray([width, height]);

    var cbData;
    for(var xPos = 0; xPos < width; xPos++) {
        for(var yPos = 0; yPos < height; yPos++) {
            cbData = callback(xPos, yPos, sourceInfo);
            if(cbData) {
                if(color instanceof Function)
                    surface.set(xPos, yPos, color(xPos, yPos, sourceInfo, cbData));
                else
                    surface.set(xPos, yPos, color);
            }
        }
    }

    return surface.surface;
}

function solid() {
    var width, height, color, surface;

    if(arguments.length === 4) {
        surface = arguments.length[0];
        width = arguments.length[0];
        height = arguments.length[1];
        color = arguments.length[2];
    }
    else if(arguments.length === 3) {
        surface = arguments.length[0];
        if(arguments[1] instanceof Array) {
            width = arguments[1][0];
            height = arguments[1][1];
            color = arguments[2];
        }
        else {
            width = arguments[1];
            height = arguments[2];
        }
    }
    else if(arguments.length === 2) {
        surface = arguments[0];
        if(arguments[1] instanceof Array) {
            width = arguments[1][0];
            height = arguments[1][1];
        }
        else {
            throw new Error('Improper arguments for solid surface');
        }
    }
    else if(arguments.length === 1 && arguments[0] instanceof Array) {
        width = arguments[0][0];
        height = arguments[0][1];
    }
    else {
        throw new Error('Improper arguments for solid surface');
    }

    if(!surface)
        surface = new Surface(width, height);
    else
        surface.clear();

    if(color)
        surface.fill(color);

    return surface;
}

function voronoi() {
    var width,
        height,
        seed,
        pointCount,
        rand,
        points,
        minVec,
        maxVec,
        voronoiLines,
        voronoiLineColor,
        voronoiLineWidth,
        surface;

    var defaults = {
        lineColor: '#000',
        lineWidth: 1,
        seed: 0
    };

    if(arguments.length === 6) {
        surface = arguments[0];
        width = arguments[1];
        height = arguments[2];
        seed = arguments[3];
        pointCount = arguments[4];
        voronoiLineColor = arguments[5];
        voronoiLineWidth = arguments[6];
    }
    else if(arguments.length === 5) {
        surface = arguments[0];
        if(arguments[1] instanceof Array) {
            width = arguments[1][0];
            height = arguments[1][1];
            seed = arguments[2];
            pointCount = arguments[3];
            voronoiLineColor = arguments[4];
            voronoiLineWidth = arguments[5];
        }
        else {
            width = arguments[1];
            height = arguments[2];
            seed = arguments[3];
            pointCount = arguments[4];
            voronoiLineColor = arguments[5];
        }
    }
    else if(arguments.length === 4) {
        surface = arguments[0];
        if(arguments[1] instanceof Array) {
            width = arguments[1][0];
            height = arguments[1][1];
            seed = arguments[2];
            if(arguments[3] instanceof Object) {
                pointCount = arguments[3].points;
                voronoiLineColor = arguments[3].lineColor;
                voronoiLineWidth = arguments[3].lineWidth;
            }
            else {
                pointCount = arguments[3];
                voronoiLineColor = arguments[4];
            }
        }
        else {
            width = arguments[1];
            height = arguments[2];
            seed = arguments[3];
            pointCount = arguments[4];
        }
    }
    else if(arguments.length === 3) {
        surface = arguments[0];
        if(arguments[1] instanceof Array) {
            width = arguments[1][0];
            height = arguments[1][1];
            if(arguments[2] instanceof Object) {
                seed = arguments[2].seed;
                pointCount = arguments[2].points;
                voronoiLineColor = arguments[2].lineColor;
                voronoiLineWidth = arguments[2].lineWidth;
            }
            else {
                seed = arguments[2];
            }
        }
        else {
            width = arguments[1];
            height = arguments[2];
        }
    }
    else if(arguments.length === 2 && arguments[1] instanceof Array) {
        surface = arguments[0];
        width = arguments[1][0];
        height = arguments[1][1];
    }
    else {
        throw new Error('Improper arguments for voronoi surface');
    }

    voronoiLineColor = voronoiLineColor || defaults.lineColor;
    voronoiLineWidth = voronoiLineWidth || defaults.lineWidth;
    seed = seed || defaults.seed;
    pointCount = pointCount || (width + height) / 2;

    surface = solid(surface, width, height);
    rand = random.Alea(seed);
    points = [];

    minVec = [0, 0];
    maxVec = [width, height];

    var i, point, x, y, left, right, up, down;
    for(i = 0; i < pointCount; i++) {
        point = rand.vector(minVec, maxVec);
        x = point[0];
        y = point[1];
        left = x - width;
        right = x + width;
        up = y - height;
        down = y + height;
        points.push([left, up]);
        points.push([x, up]);
        points.push([right, up]);
        points.push([left, y]);
        points.push(point);
        points.push([right, y]);
        points.push([left, down]);
        points.push([x, down]);
        points.push([right, down]);
    }

    voronoiLines = voronoiGenerator(points);

    var vc, cell, c, otherPoint, point1, point2;
    for(vc in voronoiLines.cells) {
        cell = voronoiLines.cells[vc];
        for(c = 0; c < cell.length; c++) {
            otherPoint = c === 0 ? cell.length - 1 : c - 1;

            point1 = cell[c];
            point2 = cell[otherPoint];

            if(point1 === -1 || point2 === -1)
                continue;

            point1 = voronoiLines.positions[point1];
            point2 = voronoiLines.positions[point2];

            g.line(surface, voronoiLineColor, point1, point2, voronoiLineWidth);
        }
    }

    return surface;
}

module.exports = {
    noise: noise,
    relative: relative,
    solid: solid,
    voronoi: voronoi
};
