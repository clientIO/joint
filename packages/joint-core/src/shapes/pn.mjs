import { Generic } from './basic.mjs';
import { ElementView } from '../dia/ElementView.mjs';
import V from '../V/index.mjs';
import { Link as diaLink } from '../dia/Link.mjs';

export const Place = Generic.define('pn.Place', {
    size: { width: 50, height: 50 },
    attrs: {
        '.root': {
            r: 25,
            fill: '#ffffff',
            stroke: '#000000',
            transform: 'translate(25, 25)'
        },
        '.label': {
            'text-anchor': 'middle',
            'ref-x': .5,
            'ref-y': -20,
            ref: '.root',
            fill: '#000000',
            'font-size': 12
        },
        '.tokens > circle': {
            fill: '#000000',
            r: 5
        },
        '.tokens.one > circle': { transform: 'translate(25, 25)' },

        '.tokens.two > circle:nth-child(1)': { transform: 'translate(19, 25)' },
        '.tokens.two > circle:nth-child(2)': { transform: 'translate(31, 25)' },

        '.tokens.three > circle:nth-child(1)': { transform: 'translate(18, 29)' },
        '.tokens.three > circle:nth-child(2)': { transform: 'translate(25, 19)' },
        '.tokens.three > circle:nth-child(3)': { transform: 'translate(32, 29)' },

        '.tokens.alot > text': {
            transform: 'translate(25, 18)',
            'text-anchor': 'middle',
            fill: '#000000'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><circle class="root"/><g class="tokens" /></g><text class="label"/></g>',
});

export const PlaceView = ElementView.extend({

    presentationAttributes: ElementView.addPresentationAttributes({
        tokens: ['TOKENS']
    }),

    initFlag: ElementView.prototype.initFlag.concat(['TOKENS']),

    confirmUpdate: function(...args) {
        let flags = ElementView.prototype.confirmUpdate.call(this, ...args);
        if (this.hasFlag(flags, 'TOKENS')) {
            this.renderTokens();
            this.update();
            flags = this.removeFlag(flags, 'TOKENS');
        }
        return flags;
    },

    renderTokens: function() {

        const vTokens = this.vel.findOne('.tokens').empty();
        ['one', 'two', 'three', 'alot'].forEach(function(className) {
            vTokens.removeClass(className);
        });

        var tokens = this.model.get('tokens');
        if (!tokens) return;

        switch (tokens) {

            case 1:
                vTokens.addClass('one');
                vTokens.append(V('circle'));
                break;

            case 2:
                vTokens.addClass('two');
                vTokens.append([V('circle'), V('circle')]);
                break;

            case 3:
                vTokens.addClass('three');
                vTokens.append([V('circle'), V('circle'), V('circle')]);
                break;

            default:
                vTokens.addClass('alot');
                vTokens.append(V('text').text(tokens + ''));
                break;
        }
    }
});

export const Transition = Generic.define('pn.Transition', {
    size: { width: 12, height: 50 },
    attrs: {
        'rect': {
            width: 12,
            height: 50,
            fill: '#000000',
            stroke: '#000000'
        },
        '.label': {
            'text-anchor': 'middle',
            'ref-x': .5,
            'ref-y': -20,
            ref: 'rect',
            fill: '#000000',
            'font-size': 12
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><rect class="root"/></g></g><text class="label"/>',
});

export const Link = diaLink.define('pn.Link', {
    attrs: { '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' }}
});
