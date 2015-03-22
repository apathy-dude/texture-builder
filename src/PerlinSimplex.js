// Source: http://ronvalstar.nl/perlin-noise-versus-simplex-noise-in-javascript-final-comparison/
// Heavily modified to use existing Simplex library
//
// PerlinSimplex 1.2
// Ported from Stefan Gustavson's java implementation by Sean McCullough banksean@gmail.com
// http://staffwww.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf
// Read Stefan's excellent paper for details on how this code works.
// octaves and falloff implementation (and passing jslint) by Ron Valstar
// also implemented Karsten Schmidt's implementation

var SimplexNoise = require('simplex-noise');

module.exports = function() {
    var iOctaves = 1;
    var fPersistence = 0.5;
    var fResult, fFreq, fPers;
    var aOctFreq;
    var aOctPers;
    var fPersMax;

    var octFreqPers = function octFreqPers() {
        var fFreq, fPers;
        aOctFreq = [];
        aOctPers = [];
        fPersMax = 0;
        for (var i=0;i<iOctaves;i++) {
            fFreq = Math.pow(2,i);
            fPers = Math.pow(fPersistence,i);
            fPersMax += fPers;
            aOctFreq.push( fFreq );
            aOctPers.push( fPers );
        }
        fPersMax = 1 / fPersMax;
    };

    var simplex;

    return {
        noise: function(x,y,z,w) {
            fResult = 0;
            for (g=0;g<iOctaves;g++) {
                fFreq = aOctFreq[g];
                fPers = aOctPers[g];
                switch (arguments.length) {
                    case 4:  fResult += fPers*simplex.noise4D(fFreq*x,fFreq*y,fFreq*z,fFreq*w); break;
                    case 3:  fResult += fPers*simplex.noise3D(fFreq*x,fFreq*y,fFreq*z); break;
                    default: fResult += fPers*simplex.noise2D(fFreq*x,fFreq*y);
                }
            }
            return ( fResult*fPersMax + 1 )*0.5;
        },
        noiseDetail: function(octaves,falloff) {
            iOctaves = octaves||iOctaves;
            fPersistence = falloff||fPersistence;
            octFreqPers();
        },
        setRng: function(r) {
            simplex = new SimplexNoise(r);
        }
    };
};
