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

    if(arguments.length === 5) {
        if(arguments[3] instanceof Array && arguments[4] instanceof Array && arguments[3].length >= 3 && arguments[4].length >= 3) {
            width = arguments[0];
            height = arguments[1];
            seed = arguments[2];
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
        if(arguments[0] instanceof Array) {
            width = arguments[0][0];
            height = arguments[0][1];
            seed = arguments[1];
        }
        else {
            width = arguments[0];
            height = arguments[1];
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
    else if(arguments.length === 3) {
        if(arguments[0] instanceof Array) {
            width = arguments[0][0];
            height = arguments[0][1];
        }

        if(arguments[1] instanceof Array && arguments[2] instanceof Array && arguments[1].length >= 3 && arguments[2].length >= 3) {
            minR = arguments[1][0];
            minG = arguments[1][1];
            minB = arguments[1][2];
            maxR = arguments[2][0];
            maxG = arguments[2][1];
            maxB = arguments[2][2];

            if(arguments[1].length > 3)
                minA = arguments[1][3];

            if(arguments[2].length > 3)
                maxA = arguments[2][3];
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

    if(arguments.length === 3) {
        width = arguments.length[0];
        height = arguments.length[1];
        color = arguments.length[2];
    }
    else if(arguments.length === 2) {
        if(arguments[0] instanceof Array) {
            width = arguments[0][0];
            height = arguments[0][1];
            color = arguments[1];
        }
        else {
            width = arguments[0];
            height = arguments[1];
        }
    }
    else if(arguments.length === 1 && arguments[0] instanceof Array) {
        width = arguments[0][0];
        height = arguments[0][1];
    }
    else {
        throw new Error('Improper arguments for solid surface');
    }

    surface = new Surface(width, height);

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

    if(arguments.length === 5) {
        width = arguments[0];
        height = arguments[1];
        seed = arguments[2];
        pointCount = arguments[3];
        voronoiLineColor = arguments[4];
        voronoiLineWidth = arguments[5];
    }
    else if(arguments.length === 4) {
        if(arguments[0] instanceof Array) {
            width = arguments[0][0];
            height = arguments[0][1];
            seed = arguments[1];
            pointCount = arguments[2];
            voronoiLineColor = arguments[3];
            voronoiLineWidth = arguments[4];
        }
        else {
            width = arguments[0];
            height = arguments[1];
            seed = arguments[2];
            pointCount = arguments[3];
            voronoiLineColor = arguments[4];
        }
    }
    else if(arguments.length === 3) {
        if(arguments[0] instanceof Array) {
            width = arguments[0][0];
            height = arguments[0][1];
            seed = arguments[1];
            if(arguments[2] instanceof Object) {
                pointCount = arguments[2].points;
                voronoiLineColor = arguments[2].lineColor;
                voronoiLineWidth = arguments[2].lineWidth;
            }
            else {
                pointCount = arguments[2];
                voronoiLineColor = arguments[3];
            }
        }
        else {
            width = arguments[0];
            height = arguments[1];
            seed = arguments[2];
            pointCount = arguments[3];
        }
    }
    else if(arguments.length === 2) {
        if(arguments[0] instanceof Array) {
            width = arguments[0][0];
            height = arguments[0][1];
            if(arguments[1] instanceof Object) {
                seed = arguments[1].seed;
                pointCount = arguments[1].points;
                voronoiLineColor = arguments[1].lineColor;
                voronoiLineWidth = arguments[1].lineWidth;
            }
            else {
                seed = arguments[1];
            }
        }
        else {
            width = arguments[0];
            height = arguments[1];
        }
    }
    else if(arguments.length === 1 && arguments[0] instanceof Array) {
        width = arguments[0][0];
        height = arguments[0][1];
    }
    else {
        throw new Error('Improper arguments for voronoi surface');
    }

    voronoiLineColor = voronoiLineColor || defaults.lineColor;
    voronoiLineWidth = voronoiLineWidth || defaults.lineWidth;
    seed = seed || defaults.seed;
    pointCount = pointCount || (width + height) / 2;

    surface = solid(width, height);
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
;module.exports = ["images/cursor_pointerFlat_shadow.png","images/grey_arrowDownGrey.png","images/grey_arrow_down.png","images/grey_arrow_up.png","images/menus/glass/center.png","images/menus/glass/corner-cut.png","images/menus/glass/corner-round.png","images/menus/glass/horizontal.png","images/menus/glass/vertical.png","images/menus/metal/center.png","images/menus/metal/corner.png","images/menus/metal/horizontal.png","images/menus/metal/red/half/split.png","images/menus/metal/red/top-left.png","images/menus/metal/red/top-right.png","images/menus/metal/red/top.png","images/menus/metal/vertical.png","images/red_x.png"];;;function move(menu, binder) {
    var pos = [0, 0];
    var x, y;
    var maxX, maxY;

    function onmousemove(e) {
        e.preventDefault();
        x += e.clientX - pos[0];
        y += e.clientY - pos[1];
        pos[0] = e.clientX;
        pos[1] = e.clientY;

        if(x > 0 && x < maxX)
            menu.style.left = x + 'px';
        else if(x < maxX)
            menu.style.left = '0px';
        else
            menu.style.left = maxX + 'px';

        if(y > 0 && y < maxY)
            menu.style.top = y + 'px';
        else if(y < maxY)
            menu.style.top = '0px';
        else
            menu.style.top = maxY + 'px';
    }

    function onmouseup(e) {
        e.preventDefault();
        binder.style.cursor = 'grab';
        document.onmousemove = undefined;
        document.onmouseup = undefined;
    }

    function onmousedown(e) {
        e.preventDefault();

        x = menu.style.left;
        y = menu.style.top;
        maxX = menu.parentElement.clientWidth - menu.clientWidth;
        maxY = menu.parentElement.clientHeight - menu.clientHeight;

        x = x.length > 2 ? Number.parseInt(x.slice(0, -2)) : 0;
        y = y.length > 2 ? Number.parseInt(y.slice(0, -2)) : 0;

        binder.style.cursor = 'grabbing';
        document.onmousemove = onmousemove;
        document.onmouseup = onmouseup;
        pos[0] = e.clientX;
        pos[1] = e.clientY;
    }

    return onmousedown;
}

function resize(menu, binder, type) {
    var pos, x, y, width, height, minwidth, minheight, maxwidth, maxheight;

    pos = [0, 0];

    var resizeWidth = type.width !== undefined;
    var resizeHeight = type.height !== undefined;
    var moveX = type.width;
    var moveY = type.height;

    function onmousemove(e) {
        e.preventDefault();
        if(moveX)
            x += e.clientX - pos[0];
        if(moveY)
            y += e.clientY - pos[1];
        if(resizeWidth)
            if(moveX)
                width -= e.clientX - pos[0];
            else
                width += e.clientX - pos[0];
        if(resizeHeight)
            if(moveY)
                height -= e.clientY - pos[1];
            else
                height += e.clientY - pos[1];

        if(x >= 0 && width >= minwidth)
            menu.style.left = x + 'px';
        else if(x < 0)
            menu.style.left = '0px';

        if(y >= 0 && height >= minheight)
            menu.style.top = y + 'px';
        else if(y < 0)
            menu.style.top = '0px';

        //TODO: find out a way to handle x < 0
        if(x >= 0 && width < maxwidth)
            menu.style.width = width + 'px';
        else if(width > maxwidth)
            menu.style.width = maxwidth + 'px';

        //TODO: find way to handle y < 0
        if(y >= 0 && height < maxheight)
            menu.style.height = height + 'px';
        else if(height > maxheight)
            menu.style.height = maxheight + 'px';

        pos[0] = e.clientX;
        pos[1] = e.clientY;
    }

    function onmouseup(e) {
        e.preventDefault();
        document.onmousemove = undefined;
        document.onmouseup = undefined;
    }

    function onmousedown(e) {
        e.preventDefault();

        x = menu.style.left;
        y = menu.style.top;
        width = menu.style.width;
        height = menu.style.height;
        minwidth = menu.style.min-width;
        minheight = menu.style.min-height;
        maxwidth = menu.style.max-width;
        maxheight = menu.style.max-height;

        x = x.length > 2 ? Number.parseInt(x.slice(0, -2)) : 0;
        y = y.length > 2 ? Number.parseInt(y.slice(0, -2)) : 0;
        width = width.length > 2 ? Number.parseInt(width.slice(0, -2)) : 0;
        height = height.length > 2 ? Number.parseInt(height.slice(0, -2)) : 0;
        minwidth = minwidth.length > 2 ? Number.parseInt(minwidth.slice(0, -2)) : 96;
        minheight = minheight.length > 2 ? Number.parseInt(minheight.slice(0, -2)) : 96;
        maxwidth = maxwidth.length > 2 ? Number.parseInt(maxwidth.slice(0, -2)) : menu.parentElement.clientWidth;
        maxheight = maxheight.length > 2 ? Number.parseInt(maxheight.slice(0, -2)) : menu.parentElement.clientHeight;

        document.onmousemove = onmousemove;
        document.onmouseup = onmouseup;
        pos[0] = e.clientX;
        pos[1] = e.clientY;
    }

    return onmousedown;
}

module.exports = function menu() {
    var width = 0;
    var height = 0;
    var style;

    var newMenu = document.getElementById('menu-template').cloneNode(true);

    if(arguments.length === 2) {
        if(arguments[0] instanceof Array && arguments[0].length === 2) {
            width = arguments[0][0];
            height = arguments[0][1];
            style = arguments[1];
        }
        else {
            width = arguments[0];
            height = arguments[1];
        }
    }
    else if(arguments.length === 1) {
        if(arguments[0] instanceof Array && arguments[0].length > 1) {
            width = arguments[0][0];
            height = arguments[0][1];
        }
        else {
            style = arguments[0];
        }
    }
    else {
        throw new Error('improper arguments for menu');
    }

    if(width && height) {
        newMenu.style.width = width + 'px';
        newMenu.style.height = height + 'px';
    }

    if(style)
        newMenu.classList.add(style);

    newMenu.children[0].onmousedown = resize(newMenu, newMenu.children[0], { width: true, height: true });
    newMenu.children[1].onmousedown = move(newMenu, newMenu.children[1]);
    newMenu.children[2].onmousedown = resize(newMenu, newMenu.children[2], { width: false, height: true });
    newMenu.children[3].onmousedown = resize(newMenu, newMenu.children[3], { width: true });
    newMenu.children[5].onmousedown = resize(newMenu, newMenu.children[5], { width: false });
    newMenu.children[6].onmousedown = resize(newMenu, newMenu.children[6], { width: true, height: false });
    newMenu.children[7].onmousedown = resize(newMenu, newMenu.children[7], { height: false });
    newMenu.children[8].onmousedown = resize(newMenu, newMenu.children[8], { width: false, height: false });

    return newMenu;
};
;module.exports = [];;var gamejs = require('gamejs');
var SurfaceFactory = require('./src/SurfaceFactory');
var menuBuilder = require('./src/menuBuilder');

var backgroundLayer = require('./src/layers/background');

//Preload image and sound assets
gamejs.preload(require('./src/images'));

var BORDER_WIDTH = 1;

var wrapper;
var menu;
var menuCanvasContext;
var surface;
var draw = true;
var fetch = true;
var listeners = {};

function buildMenu() {
    var menu = menuBuilder([700, 522], 'metal');
    var menuCenter = menu.children[4];

    var leftDiv = (function() {
        var div = document.createElement('div');
        div.className = 'leftdiv';

        var menuCanvas = (function() {
            var canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            canvas.className = 'canvas';
            menuCanvasContext = canvas.getContext('2d');
            return canvas;
        })();

        var layerDiv = (function() {
            var div = document.createElement('div');
            div.className = 'controls';
            div.style.width = '100%';
            div.style.display = 'block';
            div.style.padding = '5px';

            var addLayerDiv = (function() {
                var div = document.createElement('div');

                var title = (function() {
                    var div = document.createElement('div');
                    div.innerHTML = 'Add Layer';

                    return div;
                })();

                var type = (function() {
                    var select = document.createElement('select');

                    function createOption(name, value) {
                        var option = document.createElement('option');
                        option.innerHTML = name;
                        option.value = value;
                        return option;
                    }

                    select.appendChild(createOption('solid', 0));
                    select.appendChild(createOption('noise', 1));
                    select.appendChild(createOption('voronoi', 2));
                    select.appendChild(createOption('shadow', 3));

                    return select;
                })();

                var add = (function() {
                    var button = document.createElement('input');
                    button.type = 'button';
                    button.value = '+';
                    button.style.float = 'right';

                    return button;
                })();

                div.appendChild(title);
                div.appendChild(type);
                div.appendChild(add);

                return div;
            })();

            div.appendChild(addLayerDiv);

            return div;
        })();

        div.appendChild(menuCanvas);
        div.appendChild(layerDiv);

        return div;
    })();

    var controlDiv = (function(listeners) {
        var div = document.createElement('div');
        div.className = 'controls';

        listeners.layer = {};

        function onchange(e) {
            e.preventDefault();
            function runHandle(listeners) {
                for(var l in listeners) {
                    if(listeners[l] instanceof Object)
                        runHandle(listners[l]);
                    else if(listeners[l] instanceof Function && l === 'handle')
                        listeners[l]();
                }
            }
            surface = renderSurface(surface, listeners);
        }

        listeners.background = {};
        listeners.noise = {};
        listeners.voronoi = {};
        listeners.shadow = {};

        var layerControl = function() {
            var div = document.createElement('div');
            div.className = 'menu-controls';

            var close = (function() {
                var button = document.createElement('input');
                button.input = 'button';
                button.className = 'close';

                return button;
            })();

            var up = (function() {
                var button = document.createElement('input');
                button.input = 'button';
                button.className = 'up-arrow';

                return button;
            })();

            var down = (function() {
                var button = document.createElement('input');
                button.input = 'button';
                button.className = 'down-arrow';

                return button;
            })();

            div.appendChild(close);
            div.appendChild(up);
            div.appendChild(down);

            return div;
        };

        var backgroundDiv = backgroundLayer.dataGUI(listeners.background);

        var noiseDiv = (function(listeners) {
            var div = document.createElement('div');
            div.className = 'control';
            div.innerHTML = 'Noise';

            listeners.seed = {};
            listeners.red = {};
            listeners.green = {};
            listeners.blue = {};
            listeners.alpha = {};

            var seedWrapper = (function(listeners) {
                var wrapper = document.createElement('div');
                wrapper.innerHTML = 'Seed: ';

                var seed = (function(listeners) {
                    var text = document.createElement('input');
                    text.type = 'text';
                    text.value = '1';
                    text.onchange = onchange;

                    listeners.value = function() {
                        return text.value;
                    };

                    return text;
                })(listeners);

                wrapper.appendChild(seed);

                return wrapper;
            })(listeners.seed);

            var redWrapper = (function(listeners) {
                var wrapper = document.createElement('div');
                wrapper.innerHTML = 'Red: ';

                listeners.min = {};
                listeners.max = {};

                var min = (function(listeners) {
                    var number = document.createElement('input');
                    number.type = 'number';
                    number.value = 0;
                    number.onchange = onchange;

                    listeners.value = function() {
                        return Number.parseInt(number.value);
                    };

                    listeners.handle = function() {
                        console.log('asd');
                        if(number.value < 0)
                            number.value = 0;
                    };

                    return number;
                })(listeners.min);

                var max = (function(listeners) {
                    var number = document.createElement('input');
                    number.type = 'number';
                    number.value = 32;
                    number.onchange = onchange;

                    listeners.value = function() {
                        return Number.parseInt(number.value);
                    };

                    listeners.handle = function() {
                        if(number.value > 255)
                            number.value = 32;
                    };

                    return number;
                })(listeners.max);

                var arrow = (function() {
                    var text = document.createElement('span');
                    text.innerHTML = '-';

                    return text;
                })();

                listeners.handle = function() {
                    if(min.value > max.value)
                        min.value = max.value;
                };

                wrapper.appendChild(min);
                wrapper.appendChild(arrow);
                wrapper.appendChild(max);

                return wrapper;
            })(listeners.red);
            var greenWrapper = (function(listeners) {
                var wrapper = document.createElement('div');
                wrapper.innerHTML = 'Green: ';

                listeners.min = {};
                listeners.max = {};

                var min = (function(listeners) {
                    var number = document.createElement('input');
                    number.type = 'number';
                    number.value = 0;
                    number.onchange = onchange;

                    listeners.value = function() {
                        return Number.parseInt(number.value);
                    };

                    listeners.handle = function() {
                        if(number.value < 0)
                            number.value = 0;
                    };

                    return number;
                })(listeners.min);

                var max = (function(listeners) {
                    var number = document.createElement('input');
                    number.type = 'number';
                    number.value = 32;
                    number.onchange = onchange;

                    listeners.value = function() {
                        return Number.parseInt(number.value);
                    };

                    listeners.handle = function() {
                        if(number.value > 255)
                            number.value = 255;
                    };

                    return number;
                })(listeners.max);

                var arrow = (function() {
                    var text = document.createElement('span');
                    text.innerHTML = '-';

                    return text;
                })();

                listeners.handle = function() {
                    if(min.value > max.value)
                        min.value = max.value;
                };

                wrapper.appendChild(min);
                wrapper.appendChild(arrow);
                wrapper.appendChild(max);

                return wrapper;
            })(listeners.green);
            var blueWrapper = (function(listeners) {
                var wrapper = document.createElement('div');
                wrapper.innerHTML = 'Blue: ';

                listeners.min = {};
                listeners.max = {};

                var min = (function(listeners) {
                    var number = document.createElement('input');
                    number.type = 'number';
                    number.value = 0;
                    number.onchange = onchange;

                    listeners.value = function() {
                        return Number.parseInt(number.value);
                    };

                    listeners.handle = function() {
                        if(number.value < 0)
                            number.value = 0;
                    };

                    return number;
                })(listeners.min);

                var max = (function(listeners) {
                    var number = document.createElement('input');
                    number.type = 'number';
                    number.value = 32;
                    number.onchange = onchange;

                    listeners.value = function() {
                        return Number.parseInt(number.value);
                    };

                    listeners.handle = function() {
                        if(number.value > 255)
                            number.value = 255;
                    };

                    return number;
                })(listeners.max);

                var arrow = (function() {
                    var text = document.createElement('span');
                    text.innerHTML = '-';

                    return text;
                })();

                listeners.handle = function() {
                    if(min.value > max.value)
                        min.value = max.value;
                };

                wrapper.appendChild(min);
                wrapper.appendChild(arrow);
                wrapper.appendChild(max);

                return wrapper;
            })(listeners.blue);
            var alphaWrapper = (function(listeners) {
                var wrapper = document.createElement('div');
                wrapper.innerHTML = 'Alpha: ';

                listeners.min = {};
                listeners.max = {};

                var min = (function(listeners) {
                    var number = document.createElement('input');
                    number.type = 'number';
                    number.value = 0;
                    number.onchange = onchange;

                    listeners.value = function() {
                        return Number.parseInt(number.value);
                    };

                    listeners.handle = function() {
                        if(number.value < 0)
                            number.value = 0;
                    };

                    return number;
                })(listeners.min);

                var max = (function(listeners) {
                    var number = document.createElement('input');
                    number.type = 'number';
                    number.value = 120;
                    number.onchange = onchange;

                    listeners.value = function() {
                        return Number.parseInt(number.value);
                    };

                    listeners.handle = function() {
                        if(number.value > 255)
                            number.value = 255;
                    };

                    return number;
                })(listeners.max);

                var arrow = (function() {
                    var text = document.createElement('span');
                    text.innerHTML = '-';

                    return text;
                })();

                listeners.handle = function() {
                    if(min.value > max.value)
                        min.value = max.value;
                };

                wrapper.appendChild(min);
                wrapper.appendChild(arrow);
                wrapper.appendChild(max);

                return wrapper;
            })(listeners.alpha);

            div.appendChild(layerControl());
            div.appendChild(seedWrapper);
            div.appendChild(redWrapper);
            div.appendChild(greenWrapper);
            div.appendChild(blueWrapper);
            div.appendChild(alphaWrapper);

            return div;
        })(listeners.noise);

        var voronoiDiv = (function(listeners) {
            var div = document.createElement('div');
            div.className = 'control';
            div.innerHTML = 'Voronoi';

            listeners.seed = {};
            listeners.width = {};
            listeners.color = {};
            listeners.points = {};

            var seedWrapper = (function(listeners) {
                var wrapper = document.createElement('div');
                wrapper.innerHTML = 'Seed: ';

                var seed = (function(listeners) {
                    var text = document.createElement('input');
                    text.type = 'text';
                    text.value = '1';
                    text.onchange = onchange;

                    listeners.value = function() {
                        return text.value;
                    };

                    return text;
                })(listeners);

                wrapper.appendChild(seed);

                return wrapper;
            })(listeners.seed);

            var widthWrapper = (function(listeners) {
                var wrapper = document.createElement('div');
                wrapper.innerHTML = 'Width: ';

                var width = (function(listeners) {
                    var text = document.createElement('input');
                    text.type = 'number';
                    text.value = '1';
                    text.onchange = onchange;

                    listeners.value = function() {
                        return text.value;
                    };

                    return text;
                })(listeners);

                wrapper.appendChild(width);

                return wrapper;
            })(listeners.width);

            var colorWrapper = (function(listeners) {
                var wrapper = document.createElement('div');
                wrapper.innerHTML = 'Color: ';

                var color = (function(listeners) {
                    var text = document.createElement('input');
                    text.type = 'text';
                    text.value = '#111';
                    text.onchange = onchange;

                    listeners.value = function() {
                        return text.value;
                    };

                    return text;
                })(listeners);

                wrapper.appendChild(color);

                return wrapper;
            })(listeners.color);

            var pointsWrapper = (function(listeners) {
                var wrapper = document.createElement('div');
                wrapper.innerHTML = 'Cells: ';

                var points = (function(listeners) {
                    var number = document.createElement('input');
                    number.type = 'number';
                    number.value = 10;
                    number.onchange = onchange;

                    listeners.value = function() {
                        return Number.parseInt(number.value);
                    };

                    listeners.handle = function() {
                        if(number.value < 1)
                            number.value = 1;
                    };

                    return number;
                })(listeners);

                wrapper.appendChild(points);

                return wrapper;
            })(listeners.points);

            div.appendChild(layerControl());
            div.appendChild(seedWrapper);
            div.appendChild(widthWrapper);
            div.appendChild(colorWrapper);
            div.appendChild(pointsWrapper);

            return div;
        })(listeners.voronoi);

        var shadowDiv = (function(listeners) {
            var div = document.createElement('div');
            div.className = 'control';
            div.innerHTML = 'Shadow';

            div.appendChild(layerControl());

            return div;
        })(listeners.shadow);

        div.appendChild(backgroundDiv);
        div.appendChild(noiseDiv);
        div.appendChild(voronoiDiv);
        div.appendChild(shadowDiv);

        return div;
    })(listeners);

    menuCenter.appendChild(leftDiv);
    menuCenter.appendChild(controlDiv);

    return menu;
}

function renderSurface(mainSurface, surfaceArgs) {
    var surfaceLayers = [];
    var size = 64;

    mainSurface = SurfaceFactory.solid([size, size]);

    if(!surfaceArgs)
        return mainSurface;

    var backgroundSurface = (function(args) {
        return SurfaceFactory.solid([size, size], args.color.value());
    })(surfaceArgs.background);

    var noiseSurface = (function(args) {
        return SurfaceFactory.noise([size, size],
            args.seed.value(),
            [
                args.red.min.value(),
                args.green.min.value(),
                args.blue.min.value(),
                args.alpha.min.value()
            ],
            [
                args.red.max.value(),
                args.green.max.value(),
                args.blue.max.value(),
                args.alpha.max.value(),
            ]);
    })(surfaceArgs.noise);

    var voronoiSurface = (function(args) {
        return SurfaceFactory.voronoi([size, size], {
            seed: args.seed.value(),
            lineWidth: args.width.value(),
            lineColor: args.color.value(),
            points: args.points.value()
        });
    })(surfaceArgs.voronoi);

    var shadowSurface = SurfaceFactory.relative(voronoiSurface,
        function color(xPos, yPos, sourceInfo, data) {
            var pixel = sourceInfo.get(xPos, yPos);
            pixel[3] += (12 - data.dist) * 3;

            if(data.y < 0) {
                pixel[0] = 160;
                pixel[1] = 160;
                pixel[2] = 160;
            }

            return pixel;
        },
        function callback(xPos, yPos, sourceInfo) {
            var shadowLength = 8;

            if(sourceInfo.get(xPos, yPos)[3] > 0)
                return false;

            var d;
            for(var sL = 1; sL < shadowLength; sL++) {
                for(var yMulti = -1; yMulti < 2; yMulti++) {
                    if(yMulti === 0)
                        continue;

                    var yp = yPos + sL * yMulti;
                    var xp = xPos + sL * 0;

                    if(yp > size)
                        yp -= size;
                    else if(yp < 0)
                        yp += size;

                    d = sourceInfo.get(xp, yp);
                    if(d[3] > 0)
                        return { dist: sL, y: yMulti };
                }
            }

            return false;
        });

    surfaceLayers.push(backgroundSurface);
    surfaceLayers.push(noiseSurface);
    surfaceLayers.push(voronoiSurface);
    surfaceLayers.push(shadowSurface);

    for(var surf in surfaceLayers)
        mainSurface.blit(surfaceLayers[surf]);

    return mainSurface;
}

function render(surface) {
    menuCanvasContext.putImageData(surface.scale([256, 256]).getImageData(), 0, 0);

    var display = gamejs.display.getSurface();
    display.clear();
    var width = display.getSize()[0];
    var height = display.getSize()[1];

    var size = surface.getSize();

    for(var xMod = 0; xMod * size[0] < width; xMod ++)
        for(var yMod = 0; yMod * size[1] < height; yMod ++)
            display.blit(surface, [xMod * size[0], yMod * size[1]]);
}

gamejs.ready(function() {
    var wrapper = document.getElementById('gjs-canvas-wrapper');

    //document.getElementById('gjs-fullscreen-toggle').style.display = 'block';
    wrapper.style.display = 'block';

    var width = window.innerWidth - BORDER_WIDTH * 2;
    var height = window.innerHeight - BORDER_WIDTH * 2;

    //gamejs.display.setMode([width, height], gamejs.display.FULLSCREEN);
    gamejs.display.setMode([width, height]);
});

gamejs.onTick(function() {
    if(!menu) {
        menu = buildMenu();
    }

    if(!surface)
        surface = renderSurface(surface, listeners);

    if(!wrapper) {
        wrapper = document.getElementById('gjs-canvas-wrapper');
        wrapper.appendChild(menu);
    }

    render(surface);
});
