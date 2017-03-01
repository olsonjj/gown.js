var Theme = require('./Theme');

/**
 * load theme from .json file.
 *
 * @class Theme
 * @memberof GOWN
 * @constructor
 */
function ThemeParser(jsonPath, global) {
    Theme.call(this, global);

    // components that show something and can be used as skin (see GOWN.shapes)
    this.skinComponents = this.skinComponents || this.getSkinComponents();

    this.addThemeData(jsonPath);
}

ThemeParser.prototype = Object.create( Theme.prototype );
ThemeParser.prototype.constructor = ThemeParser;
module.exports = ThemeParser;

// load theme data
ThemeParser.DATA_LOADED = 'data_loaded';

/**
 * get component classes that can create skins (in general all GOWN.shapes)
 * note that image textures are not components
 */
ThemeParser.prototype.getSkinComponents = function () {
    var cmps = {};
    if (GOWN.shapes) {
        cmps.rect = GOWN.shapes.Rect;
        cmps.diamond = GOWN.shapes.Diamond;
        cmps.ellipse = GOWN.shapes.Ellipse;
        cmps.line = GOWN.shapes.Line;
    }
    return cmps;
};

ThemeParser.prototype.loadComplete = function(loader, resources) {
    this.setCache(resources);

    if (resources) {
        var res = resources[this._jsonPath];
        if (res) {
            this.themeData = res.data;
        }

        this.applyTheme();
        Theme.prototype.loadComplete.call(this, loader, resources);
    }
};

ThemeParser.prototype.themeApplyTheme = Theme.prototype.applyTheme;
ThemeParser.prototype.applyTheme = function() {
    if (!this.themeData) {
        return;
    }
    this.parseData(this.themeData);
    this.themeApplyTheme();
};

/**
 * get scale9 grid data from theme data
 */
ThemeParser.prototype.getScale9 = function(scale) {
    return new PIXI.Rectangle(
        parseInt(scale[0])*this.themeScale, parseInt(scale[1])*this.themeScale,
        parseInt(scale[2])*this.themeScale, parseInt(scale[3])*this.themeScale);
};

/**
 * create new skin from theme data
 * @param data {String}
 * @returns {function}
 */
ThemeParser.prototype.skinFromData = function(skinData, data) {
    if (skinData.type === 'texture') {
        var scale9;
        if (skinData.scale9 && skinData.scale9 in data.grids) {
            scale9 = this.getScale9(data.grids[skinData.scale9]);
        } else {
            return this.getImage(skinData.texture);
        }
        if (!(skinData.texture in data.frames) && window.console) {
            window.console.error('texture not found in texture atlas: ' +
                skinData.texture + ' ' +
                'please check ' + this._jsonPath);
            return null;
        }

        return this.getScaleContainer(skinData.texture, scale9, skinData.middleWidth, skinData.centerHeight);
    } else if (skinData.type in this.skinComponents) {
        // keep component in scope
        var CmpClass = this.skinComponents[skinData.type];
        return function() {
            var cmp = new CmpClass();
            for (var key in skinData) {
                if (key === 'type') {
                    continue;
                }
                cmp[key] = skinData[key];
            }
            return cmp;
        };
    }
};

/**
 * create dictionary containing skin data (including default values)
 * @param stateName name of current state (e.g. GOWN.Button.UP) {String}
 * @param skinData data gathered from previous runs {String}
 * @param data new data that will be copied into skinData {Object}
 */
ThemeParser.prototype.getSkinData = function(stateName, skinData, data) {
    if (!data) {
        return;
    }

    var copyInto = function(source, target) {
        if (!source) {
            return;
        }
        for (var key in source) {
            target[key] = source[key];
        }
    };

    // get default skin for all states...
    copyInto(data.all, skinData);

    // ... override default values for current state
    copyInto(data[stateName], skinData);
};

ThemeParser.prototype.parseData = function(data) {
    this.hoverSkin = data.hoverSkin;
    this.thumbSkin = data.thumbSkin;
    this.themeScale = data.themeScale || 1.0;

    if (data.textStyle) {
        this.textStyle.fill = data.textStyle.fill;
        this.textStyle.fontFamily = data.textStyle.fontFamily;
    }
    if (!data.skins) {
        return;
    }

    for (var componentName in data.skins) {
        if (componentName === 'default') {
            continue;
        }
        // create skin for componentName (e.g. button) from data

        var states = data.skins[componentName];
        //var skins = data.skins[componentName];
        for (var stateName in states) {
            if (stateName === 'all') {
                continue;
            }

            var skinData = {};
            // set defaults
            this.getSkinData(stateName, skinData, data.skins.default);

            // override defaults with component data
            if (componentName in data.skins) {
                this.getSkinData(stateName, skinData, data.skins[componentName]);
            }

            // create skin from skinData for current skin
            var skin = this.skinFromData(skinData, data);
            if (skin) {
                // skin.minWidth
                this.setSkin(componentName, stateName, skin);
            }
        }
    }
};

ThemeParser.prototype.addThemeData = function(jsonPath) {
    this.addImage(jsonPath);
};
