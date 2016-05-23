//      JointJS library (http://jointjs.com)
//      (c) 2011-2014 client IO. http://client.io.

joint.shapes.board = {};

joint.shapes.board.Board = joint.shapes.basic.Generic.extend({

    markup: [
        '<g class="rotatable">',
        '<g class="scalable">',
        '<g class="regions">',
        '</g>',
        '</g>',
        '</g>'
    ].join(''),
    regionMarkup: '<g class="region"><rect/><text/><g class="controls"></g></g>',
    controlMarkup: '<image />',

    defaults: joint.util.deepSupplement({

        type: 'board.Board',
        attrs: {
            '.regions rect': { fill: 'white', stroke: 'lightgray' },
            '.region-cell rect': { 'pointer-events': 'none', fill: '#f8ecc2' },
            '.region-header rect': { 'pointer-events': 'auto', fill: '#fce883', opacity: .7 }
        }

    }, joint.shapes.basic.Generic.prototype.defaults),

    getRowBBox: function(rowIdx) {

        var position = this.get('position');
        var regions = this.get('regions');
        var rows = regions.rows;
        var cols = regions.cols;

        var bbox = g.rect({ x: position.x, y: position.y, width: 0, height: 0 });

        for (var i = 0; i < rowIdx; i++) {
            bbox.y += rows[i].height + (rows[i].gap || 0);
        }
        bbox.height = rows[rowIdx].height;

        _.each(cols, function(col) {
            bbox.width += col.width + (col.gap || 0);
        });

        return bbox;
    },

    getColBBox: function(colIdx) {

        var position = this.get('position');
        var regions = this.get('regions');
        var rows = regions.rows;
        var cols = regions.cols;

        var bbox = g.rect({ x: position.x, y: position.y, width: 0, height: 0 });

        for (var i = 0; i < colIdx; i++) {
            bbox.x += cols[i].width + (cols[i].gap || 0);
        }
        bbox.width = cols[colIdx].width;

        _.each(rows, function(row) {
            bbox.height += row.height + (row.gap || 0);
        });

        return bbox;
    },

    findElementsInColumn: function(elements, colIdx) {

        var colBbox = this.getColBBox(colIdx);
        return _.filter(elements, function(el) {

            var bbox = g.rect(el.getBBox());
            var center = bbox.center();
            if (colBbox.containsPoint(center)) {
                return true;
            }
        });
    },

    findElementsInRow: function(elements, rowIdx) {

        var rowBbox = this.getRowBBox(rowIdx);
        return _.filter(elements, function(el) {

            var bbox = g.rect(el.getBBox());
            var center = bbox.center();
            if (rowBbox.containsPoint(center)) {
                return true;
            }
        });
    }
});

joint.shapes.board.BoardView = joint.dia.ElementView.extend({

    initialize: function() {

        joint.dia.ElementView.prototype.initialize.apply(this, arguments);

        this.listenTo(this.model, 'change:regions', _.bind(function() { this.update(); }, this));
    },

    renderMarkup: function() {

        joint.dia.ElementView.prototype.renderMarkup.apply(this, arguments);

        // Cache important elements for faster access.
        this.elRegions = this.$('.regions')[0];

        // An SVG element for repeatable elements. This will be used as an original for future clones.
        this.elRegion = V(this.model.regionMarkup);
        this.elControl = V(this.model.controlMarkup);
    },

    update: function() {

        var size = this.model.get('size');
        var width = size.width;
        var height = size.height;

        var regions = this.model.get('regions');

        var x = 0;
        var y = 0;

        this.elRegions.textContent = '';

        _.each(regions.rows, function(row, rowIdx) {

            _.each(regions.cols, function(col, colIdx) {

                if (colIdx !== 0 || rowIdx !== 0) {

                    this.renderRegion(x, y, col.width - (col.gap || 0), row.height - (row.gap || 0), row, col, rowIdx, colIdx);
                }
                x += col.width;

            }, this);

            x = 0;
            y += row.height;

        }, this);

        // Apply attrs.
        joint.dia.ElementView.prototype.update.apply(this, arguments);
    },

    renderRegion: function(x, y, width, height, row, col, rowIdx, colIdx) {

        var elRegion = this.elRegion.clone();
        elRegion.attr({
            'data-x': colIdx,
            'data-y': rowIdx,
            'data-row-id': row.id,
            'data-col-id': col.id
        });
        elRegion.findOne('rect').attr({ x: x, y: y, width: width, height: height });

        if (colIdx === 0 || rowIdx === 0) {
            elRegion.addClass('region-header');
        } else {
            elRegion.addClass('region-cell');
        }

        this.renderControls.apply(this, [elRegion].concat(_.toArray(arguments)));
        this.renderContent.apply(this, [elRegion].concat(_.toArray(arguments)));

        V(this.elRegions).append(elRegion);
    },

    renderContent: function(elRegion, x, y, width, height, row, col, rowIdx, colIdx) {

        var content = this.model.get('content') && this.model.get('content')[row.id + '@' + col.id];
        if (!content) return;

        _.each(content.elements, function(element) {

            var specialAttributes = ['text', 'style'];

            var el = V(element.tag).attr(_.omit(element.attrs, specialAttributes));
            if (element.attrs.text) {
                el.text(element.attrs.text);
            }
            if (element.attrs.style) {
                $(el.node).css(element.attrs.style);
            }
            el.translate(x + (element['ref-x'] || 0), y + (element['ref-y'] || 0));
            elRegion.append(el);
        });
    },

    renderControl: function(elRegion, name, attrs) {

        var elControl = this.elControl.clone();
        elControl.attr(_.extend({
            cursor: 'pointer'
        }, attrs));
        elControl.addClass('handle');
        elControl.addClass(name);
        elRegion.append(elControl);

        return elControl;
    },

    renderControls: function(elRegion, x, y, width, height, row, col, rowIdx, colIdx) {

        var regions = this.model.get('regions');

        if (colIdx === 0 && rowIdx !== 0) {

            this.renderControl(elRegion, 'shrink-row', {
                x: x + width - 12,
                y: y + height - 37,
                width: 10,
                height: 35,
                'data-row-idx': rowIdx,
                'xlink:href': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAABiCAYAAABDJbMlAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAmlJREFUeNrsWu1twjAQdSz+0w3iqv0PG5ROABvABs0GNRvQDWCDMkFhg/R/JcIGMAE9VwYFEzvnr7SqfJKF2ip9efa7u3dus9PpRJrikd0P4WNBzMFg5bWvt1/VbmR6oGf42R2sJxI4KOk4EmACTIAJMAH+M8BDp4DQSMt0hgnwTwBmDznj8KmzdiFd2xyUz4VN3MB6jUxsf/a4FFAF4DoyIAecQ/0MC1jHSGDCjS+vRAPfqBC23pndlWjqswXME5UyK/jGGshMTGkxC8yuMOahFNA2YBpUmMQPwfKo0wRtaEvireah0uCm0jQNpCAeMRuWjgLaAxizqqXy7bgjO+ORZLqRWzLdWNbT1pGb2srah10roPQ1b0iwVVMauPRDjqizR+xutAIiBbTQpYGVaBQBie0d2KaBj8UoMN0gGKCssytTr4tholQBWRcHK0ClUa8ka7sQorFd4PRKWMzlWbRKk/NOgF6AUOZmsFgngNJ+LFyNswtDUVP7sMYAPrIe12zyUG7jzrVTuNbSeuTwEjwKQ7l9H5puP8TYC1uGOiZ9GwFRJLtJi11ECwjLEMNgGQQQ3rxAWn6UgNqct0jySp4TdmpiJgdHkUmOjVYBZYY/56lJbhPPOvtBPYVi/Sw1JPnYA3AgxYZmyIl/cCk6M6DodSTMHVujgGgkdueYqhWIKux44IuhGwFRJckLEj6uBESVreyTOHEREK0l+UtEs3YR0E+lAcB3z7xDV6DzPw6UcqkhmE8tf+mnRgsHcUnR1i10tsL5riZZ/QSYABPgLwM63TSlLf0PgKxrwDydYQIMGj2MlwwJ+C3AAHnQLQb+a/IZAAAAAElFTkSuQmCC'
            });

            this.renderControl(elRegion, 'expand-row', {
                x: x + width - 12,
                y: y + height - 37 - 37,
                width: 10,
                height: 35,
                'data-row-idx': rowIdx,
                'xlink:href': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAABiCAYAAABDJbMlAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAn1JREFUeNrsmtFtwjAQhg3ivdmAoPaddALoBB0BRvAGTScgGxRG6ASlExTeKzXZACZIz5GD0tSx7xw7opVPsiJE4s/n/He52GFlWTJKu53GMTROva5uY0a3LbTNXTyLLa6lAQGyhMNC/sy8A1uQRzkAP0DofA2HuWJ6STYSNxIBi+CQQ7tR/P38mX+lrj3kHbDqP4qAxgjvRGdPmlPEQJx6iOlshRXQGBEGKwsFW3uYEgQ4hwFya5XKMHghqv4MLQbVnmw8TC0SiVFASg/Bu9SgTJPdg5cHlIcyyDnrZxllSjNNkGNtITWgn1I4KYHDB3NjBbSkLaCxTSwhbaq6NRcPZZC/Mfc2Ay9zlYdb5se2v6ZUZoipJ+CimWdHUBDpnnWurIBpjWsPuWdYJSCZTCoPRShEHSdSRXSEttTlUm2JAaMqbafOVdWGiT02JJAFYAAGYAAGYAAG4B8EHocGnlwDTVWbqoQ8db1s9gb6sABkQ4tGvBEnxD65TlQTw8XiPWFBBEZ94vAwdOCH5H0VwGRoYBTuYQAGYABeNzD/98AgGvLjqSoT5Xp0LFv74rnDwTxMGh2vPM/mO9Sr+3pKhYdnz0B+uYdyFZ57hO3qary9u7a3qLRNJmYuqfef2ipNPXiXdW12iakVHu4ce5eZ4pA7FBBv79J0bToL6KYnTLlLo8w0cGLmYMlkTU1tvG+Qk4A9BcRtk7eNgHa6V24tUCosJYZB2uvxRBTQjyDv8zzECKhgiO8AUECkgFLdVqw28FVm+PLrCDDUeg66xDAICB2z5KUv8PTQKjtEkC99FlEck8KcAaWAXhtBnnsFNrwsrPKt7Yep4sNWm+u+BRgAUzOTjjSE3EkAAAAASUVORK5CYII='
            });

            this.renderControl(elRegion, 'add-row', {
                x: x - 10,
                y: y - 10,
                width: 20,
                height: 20,
                'data-row-idx': rowIdx,
                'xlink:href': 'data:image/png;base64,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'
            });

            if (rowIdx === regions.rows.length - 1) {

                this.renderControl(elRegion, 'add-row', {
                    x: x - 10,
                    y: y + height - 10,
                    width: 20,
                    height: 20,
                    'data-row-idx': rowIdx + 1,
                    'xlink:href': 'data:image/png;base64,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'
                });
            }

            this.renderControl(elRegion, 'delete-row', {
                x: x - 10,
                y: y - 10 + height / 2,
                width: 20,
                height: 20,
                'data-row-idx': rowIdx,
                'xlink:href': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAARO0lEQVR42u1dCZgcRRUeFQVvVFSUaCBsVXVW7jUQtqtnQyDIJYcSRYOCIsoh0aBAIkIE5QxRRBCDyBkOQwyCEgnJHAkRkEMIJEIwCCFcK4QQkIRwre9V936Qmeqpqu6unp6Zft/XX5Jvdzo9/f/16tU7C4Vccskll1xyySWXXHLJJZe2kcmFwjvnut2fLXOnr+w5h1Q8dhxcZ5Vc9vsKJ9PLHpsB16ySR66rcHpVhbOLy5xOqXh0IvzOt+Hvu87lZFilr2+D/G22ANiVXrIdgHZUyaWXVjxyd8ljawDwgbgXEOTVkkvuR9IAUSaUOdnp7p6ed+dvvclS2nn4UADkSADmBgBqdRJg65OCrQGy3YKEKPUylqORklT6uoYAAD+GVXlXmoBrXEuAECdXi8NJjpIF9V4qsn0rLvsrXK9nDHjJRatgW4yb0d39nhy9GDJnzDbvB8PsGHipj2QfdMk24ZKny5ydePPI7o/maBrIjT097wN1ejzs7c+1IvASIrwEWuG0W/nWH8nRVVnynByOK6cdgK+7XPYCEjvfGmTGnUs5WNb32nnx5H/CSPPYbPjzcrimwvUzUM8/8X0DziT/33QKHiFLHv0L/HuRxZPFsgp39slRB5m9Y9eH4Cj1OwD/zUReLmwbCCCCWyqSvfDUEOf55o3e6pNwz93KRfYjIOnMJLUTOqDw/h0LfrXIdim5bEUCqvUfaGzN85wdBgqFd9h/bjIctMWxgbX/RkwSPF/lbGxHAY9etLJLz46z6kuc/luo7j62eTO/y3zP+RRohx8EW0YMzUUvw1NP24OPLwy+8MKI3rc3Ub3DNTqNlW68XXhkR4wpwDbxWlRn0lzu0LYFH33o8HKeMn0xqGYB/CsrfdSJ5E/Yedgn4PO9pSL7OnoR4ToT7Y6yRy/B+/qxAzoNtRJcJ8AzfhNUc3HeSLJZFKJhAKrC2fkVj6yLQILVZY/s3X5++6LzpUjBGZf92QT42Xt0bYgaAvboyWD93wxAPxPPxiArgbhlPMdXXbqniZr2iUAvM97qXPY6BrXaaOXTo0yNpRJnD2I4Vi8+MHRjDPfCir4RgHrZ7nmerANA52IQCjWLntFIR6Chaqz5ODuj9c/3fgzeKPQKX/xUXMmN7ouqGVc6qNprI6ra2Je/NcGR06P7qXIGhJPLoz8MfBIGJKC/yaK9owk+nWi4uh4qc6dHdYKA3z20xMkD2XL3sv8AccejG7uxNhhOjCOZYK+0oNpn4w1X0xWNXp6ICIJxlvXAkHAUcXZMI3evIDGn5xi+n1+2DvgeG6dr+OCRCVTo0QobwsUMn9by/ZOl6IlsqA04G2uyJaB3swV8+myUwZ68ulp0xoRa0bsN+zCAf2ErB4Aw77DS171pOLmdHl33slhU3Plado96vV1bomtT8+X0wxffNvRecA4HG2J5W0QBMazN6f7hpxi2ue/Z1DoivoL+lMyBj/u3gTv0ibA8usBaPimx4FCmiMDOD7MNUEvA916saXCu0D2CprnvX6FrJIXlzS3sZR8MEjwH2vWCLe22sAgggoonIb37kDIulox4+YSLVcurVnKHf07qRx9JNrOWD5C9k8KjGFEMfQ/wc83cw4lNB1+4O132gs7eBV/ak96Dk2H6X7pdLnQxy30eSA5Q86v0nGaN/Sb2V7/H/qZpDY8L2fu60CboLPDfOgVVXGek/L3S0ZpRxUVNK1JBUDXPr78K1R7tYulH9yCuwoom6fvFLCS993ti6uCLVC44yukYPTI/OWbIYsCnk8F/m6v3GaxyCllkszRItDbs8/ZWv0vP1tijXpzv0S1krlD4WSUHfz2DbjEuqtp3hTUFWlskZ39MMauHbqHn7aPfke77nJybAy7VBH+SRf5AC3xB84jppuPu5fQyDau/JP8sO9DGy7t1rxEDy6dPG5g/eiu7IBWdgUf/cN7A7WN3seUnODaqnwW1agruXsbU9XlknczZgynaBq5iI/BffGjxAMqzC+baIwGA/8Ss6eL/WfvUCkskAM0qMQrn7up8TOfd6SbRxLD86SUaDzFFlsARFGZYA39QrJDgbeAPij0SyI92Qfax0kNoT/ULf7Vq7ycrMYoX3VsYD3wrJJCAb58EzqT699+3QcklD6s+Wy12bW8ryePUKO5J9PEnXe/XCPxESdAAfLskoC/LqprA/jpYI2x8ZeLgzxhbeBes7idVYU9Z1ixsCaenDX4iJNAA3yYJZED60dLGASP0CyReiSwSH9UeqVNl20ZSvXpMwY9FAgPwbZFAhMT7nK0kSSTf1cBifNJu31kq61UW5kQ3cDPBj0SCCOBb0wQunSlJg98IyPFfxefuSQx8fw9naxVsvUbm7jVNg7YBvhEJYoBvgwSoBWTlYn47O8Xn+7q7Ugv6YPRK8pDHZwV8LRIkAL4NEsD7/219CN2hqSWR+sUXjVOUal2YvrHClmUJ/IYkSBD8pEmAMRW5cc3uVCzK25Oy/lea5qxj7X8WwZeSwAL4FjTBoabhYqxcQg9iLAKIkme1ocIlVUHTsgr++iTY2hr4iZKA0znyoJxq+6Bfjbf/K1iGCQ2oJWo9VnE6fFVHdQ+8+OD9A2nI2qefSOf/ARLcuueIOF1QXq/00U3qFxpZqspEtnv8kxxT/EqeeCpv6ZSTBtpJHrv8QrHVxDQGx0k07a8Vp4h740X/FA0dMEAhIcDPk7B+24UESYAfeFqnm4bX0Q5QFayGygLe9XF14IGOkFinC5JyhLQ6CRIDPzhtyQN05hhpZvzS0arCztpKF/y3ymnUKSRIEvzBCxNp67eBxiljOPsgqv//aFUeW93D9JLtbCRjtBoJbIAvVrNLDjBNzZflZ+imfp1jmogY1PAPdDIJbIEfgDnZGCeJoa5Z6k1nKh7oTMn+f4bNnLysk8Am+MGiu9ZYU0cNDImc/sYPdIREHV1jO3s2qySwDr5/3VGfbUX2UtUdRD0CPqy48f71WoP8PY0U6qyRICXwRXV1vbfW2UFVQxhtC1DEAOQuYIVnqg1JkBb4gyev2sCbmJ2kOj1I8jQ1joHk1cYPU1/qnfaQh2aTIE3wB6/aCiLRV0HxGSw7j6ABzBMOkkoAaQUSNAN8AWZN5hX6XpQagJNhRuAH/fiMnRIqrWGPBCenCj5WITUD/PD3rmipY9pnWYcAsorUpnTttBjPt5pyHvWqSRdHm0CJVZTZhipWycq//AFJ7Q1+s0mAMZr1SvX36NpQTZoIcxWwrUvDvYjTbSR2Q38ngN9MEtSmh6GFr/oMzmmIogEUqcdslIQASzoF/GaQAANtsh5LpqTRdASxfylizV+WJChUOwn8tEkAmDxen39JR5iSRrcWcIFp9Ukwlq2jwE+TBIhJHQFccoCqMWfUcPDVptnAOH+vE8FPkQSXS2I2x1pJD8cxKapxLnVsxA7YHQp+GiTAYhtJWtj5iszgq6NqgMMUD/SItINIB4NvmwQ4t8jc7qK/iESAatHZWV292v2Buoognc6hbQy+VRLIU8MbBu2wOUf0olCVi1FyFNTtHtrO4NsgAfZVDOm0qiBNfYm5SUBomWmXStNBUe0KvgUSXCB514eqejTHaiUrBjYaliwh43LwLZBAMnFco2nXwniVwR47QuVkuG3kkPfWBidwilac0rD+8uxUgHnu9moq/8+q++4cWDBmu1g9g2q9ef57Vk5iPTNecSjv6o7CTDGeNY61mwIJBuP5tvMJBPi7b594MqhOCr5qcJWuS/hx1eRrSXn41rGPPBZJUJvMYYsEiYAvjn/si6Z+GtTOkcvCagpEL1IYGi/IJn1GGZeaBgnCMnmSJkFS4As1L+m4rpG0OyeZ9rCqtGOhauhXjC3UJpBAlcaVFAmSAj+4TpEY570aXsNkBlAH7d2fVziF5tZ+TkzyTqhBZBIk0M3hi0uCJMFHNV6bAOKvfhx537ifQKKTxcAIuVjlFZSlHSXiE0iABKYJnFFJkPDKF8OjZY2jNaakz0u4TaxO0wc6rfZzeHRJMksoCgmiZu+akiBp8HH1yzJ5cK5i1BlNcX0CS6I8MO5FiQZEDEgQN3VblwRJgx94Wc+ofZfBgM5+RSXQ89hMMnkCcHaMRlOi86RdrhMe965DgqTy9lUksAE+2k4Yi4nSe9HapHGM/CmHFrjsFWm6uEt54qHRBiRIumgjjAQ2wA+ca3VDojH5E7Tss6rSMasDpLTKv0MGGGHHyzRIYKtip5YEtsDHwRqy2UHws6karWWvKdgU0TdIo/yrzJ0+qQbRnZIdkQS2y7UGSWBv5ZPnbulln5Yl2qiqrrAhVNho3vS1gEceknkHMYPVRvkYkmDJ5AmplGs9MOkoO+D7yRv71r4zUfnjsvka9tfVhTREDH3UG2B0ekjrmSPzMXF6Vr9ORHawB0DYVHZbWmC8VndLSQ+BYIDURTno6+/7tR1X38qxVDp98JpaSFNEO1itKiDymGx8iSg+dcnNOfh+N0/ZkU/U/Ln0Ho179EdqABGbBLC6lTmD/qngJqlVC0ZhWi1lMjxGfqls0oqO+z120mdCLuILNTNaTpNrkqEbJxE2btFr2Xxvy89E3fcHt45CMyVoT/KI3sPSw2T3EJPINazcNruWhFXsYu6/ejrroMu3frRc6iLqB3Qe2CWvyTJbAk2wETqQOmPPJ5WwsW5lTnbS7rHA2YGFrAg80E81+96/UuFkN9k9gjEzp7S5tX9RbX/lt/Iv6Ta6s5XxPoUsiX+0ozdqWr1rKpzuEapRQEvYGDLdZEt/TdgW6Cd4ss/rdljDWUEyJ1vTxe9UodsnkKzDQtLwY2bXEBxB3xbgu+yf1SIZ3qATyyj4vdWa9+uXNYnKjJR6u7ZUdhZ5e22hx44LuxduCcGUzNUtCb5osUMnNqrMAU34Dd3GWqhFcIZTIetScZ2Rmt6rYIXQSxslMOA5Gc/EWj6HzIBPZzbqzedPY2NnmcwMkrWKz64m8JzdVU2majtao/ZoXKSCRhK7Ptv+fFLG9DlFXsWmJtsbEr/sOYcUWk0wsmUS+RPHH86+pS5UIdtizSIeKzMDPic3yOIeUgNXkdRRDz49utCqgjUFxiNkOLtJx9DBlVR26Qmqcer2LrocJ6bj/D71s9JNcOiT4ZHxjUYnh5YRYeUaNo1AbYDg6hx3giLJbf1pZeRuy6AvxhEs6PySxTekhqzHvmey6gdPSUCYgwrtIn7JOF0exV+OwQ58kSZZS7By9hNGFqdzNCpoQ7NzcE+HP8/FyifTjttlj+wN97kvQoBoJWydxUK7iVDZ6ikkoSsPEyVlNXK6Ca1IQmGcwn1EqjqnE1DLYJctMXaF04PRQYXaJGp4VWTvcGcf7MwVtQuIbFx820jQ2vyCOPsu+g5k5VJNd4JxeiQCGOfoKMsLaEvBocY4dzhGQOVVMdSKswNrG1SkJejgQTUPe/wVJn4PWUFNxXO+X+g0wVi42GPjF1G8hD0LMYau8iXE38a6huCZHBs2JBGvwGygVDJ5syr+nkkOj6MNZFU1/sg7ehIOtsJhCaZaArcqTLL0DTk60e+aGsmIDQ8O4RE2ok3TngaiRy+x5e4N7tsvjEmPVjFyCSv4OiDIVaDCZ/iOHOGdWwRW+JN4BrcYGbzeeIRLp0iZOz1JbAsZjQ/cAyeOXXOUtWIJYnD1wjYBf1FLBXKypRGoC+p4lk2VbPGa1yjxJRcTjeAPRzwFjMUVGU/+QJfv1EYJILnEkKAZ9ShRaczpMxkBfRW2ysPAV6y2rLlEOEJiLh0e91w2X+QappPViyHuO7DWAVa6lx/lMiLCM8fJTv44dToN4w7mUbj63Hu47hI9eTmdgEGaZnkec4nuYwgCQXQ0RvVE1Q2AKRw8nJ5c8ZxJIiAkAkTkoGrRGRMnIJRLLrnkkksuueSSSy655JJd+T8HHjKyQTT6awAAAABJRU5ErkJggg=='
            });
        }

        if (rowIdx === 0 && colIdx !== 0) {

            var controlX = x + width - 12 - 17;
            var controlY = y + height - 37 + 10;

            this.renderControl(elRegion, 'shrink-column', {
                x: controlX,
                y: controlY,
                width: 10,
                height: 35,
                transform: 'rotate(90 ' + (controlX + 10 / 2) + ' ' + (controlY + 35 / 2) + ')',
                'data-col-idx': colIdx,
                'xlink:href': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAABiCAYAAABDJbMlAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAmlJREFUeNrsWu1twjAQdSz+0w3iqv0PG5ROABvABs0GNRvQDWCDMkFhg/R/JcIGMAE9VwYFEzvnr7SqfJKF2ip9efa7u3dus9PpRJrikd0P4WNBzMFg5bWvt1/VbmR6oGf42R2sJxI4KOk4EmACTIAJMAH+M8BDp4DQSMt0hgnwTwBmDznj8KmzdiFd2xyUz4VN3MB6jUxsf/a4FFAF4DoyIAecQ/0MC1jHSGDCjS+vRAPfqBC23pndlWjqswXME5UyK/jGGshMTGkxC8yuMOahFNA2YBpUmMQPwfKo0wRtaEvireah0uCm0jQNpCAeMRuWjgLaAxizqqXy7bgjO+ORZLqRWzLdWNbT1pGb2srah10roPQ1b0iwVVMauPRDjqizR+xutAIiBbTQpYGVaBQBie0d2KaBj8UoMN0gGKCssytTr4tholQBWRcHK0ClUa8ka7sQorFd4PRKWMzlWbRKk/NOgF6AUOZmsFgngNJ+LFyNswtDUVP7sMYAPrIe12zyUG7jzrVTuNbSeuTwEjwKQ7l9H5puP8TYC1uGOiZ9GwFRJLtJi11ECwjLEMNgGQQQ3rxAWn6UgNqct0jySp4TdmpiJgdHkUmOjVYBZYY/56lJbhPPOvtBPYVi/Sw1JPnYA3AgxYZmyIl/cCk6M6DodSTMHVujgGgkdueYqhWIKux44IuhGwFRJckLEj6uBESVreyTOHEREK0l+UtEs3YR0E+lAcB3z7xDV6DzPw6UcqkhmE8tf+mnRgsHcUnR1i10tsL5riZZ/QSYABPgLwM63TSlLf0PgKxrwDydYQIMGj2MlwwJ+C3AAHnQLQb+a/IZAAAAAElFTkSuQmCC'
            });

            controlX -= 40;

            this.renderControl(elRegion, 'expand-column', {
                x: controlX,
                y: controlY,
                width: 10,
                height: 35,
                transform: 'rotate(90 ' + (controlX + 10 / 2) + ' ' + (controlY + 35 / 2) + ')',
                'data-col-idx': colIdx,
                'xlink:href': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAABiCAYAAABDJbMlAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAn1JREFUeNrsmtFtwjAQhg3ivdmAoPaddALoBB0BRvAGTScgGxRG6ASlExTeKzXZACZIz5GD0tSx7xw7opVPsiJE4s/n/He52GFlWTJKu53GMTROva5uY0a3LbTNXTyLLa6lAQGyhMNC/sy8A1uQRzkAP0DofA2HuWJ6STYSNxIBi+CQQ7tR/P38mX+lrj3kHbDqP4qAxgjvRGdPmlPEQJx6iOlshRXQGBEGKwsFW3uYEgQ4hwFya5XKMHghqv4MLQbVnmw8TC0SiVFASg/Bu9SgTJPdg5cHlIcyyDnrZxllSjNNkGNtITWgn1I4KYHDB3NjBbSkLaCxTSwhbaq6NRcPZZC/Mfc2Ay9zlYdb5se2v6ZUZoipJ+CimWdHUBDpnnWurIBpjWsPuWdYJSCZTCoPRShEHSdSRXSEttTlUm2JAaMqbafOVdWGiT02JJAFYAAGYAAGYAAG4B8EHocGnlwDTVWbqoQ8db1s9gb6sABkQ4tGvBEnxD65TlQTw8XiPWFBBEZ94vAwdOCH5H0VwGRoYBTuYQAGYABeNzD/98AgGvLjqSoT5Xp0LFv74rnDwTxMGh2vPM/mO9Sr+3pKhYdnz0B+uYdyFZ57hO3qary9u7a3qLRNJmYuqfef2ipNPXiXdW12iakVHu4ce5eZ4pA7FBBv79J0bToL6KYnTLlLo8w0cGLmYMlkTU1tvG+Qk4A9BcRtk7eNgHa6V24tUCosJYZB2uvxRBTQjyDv8zzECKhgiO8AUECkgFLdVqw28FVm+PLrCDDUeg66xDAICB2z5KUv8PTQKjtEkC99FlEck8KcAaWAXhtBnnsFNrwsrPKt7Yep4sNWm+u+BRgAUzOTjjSE3EkAAAAASUVORK5CYII='
            });

            this.renderControl(elRegion, 'add-col', {
                x: x - 10,
                y: y - 10,
                width: 20,
                height: 20,
                'data-col-idx': colIdx,
                'xlink:href': 'data:image/png;base64,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'
            });

            if (colIdx === regions.cols.length - 1) {

                this.renderControl(elRegion, 'add-col', {
                    x: x + width - 10,
                    y: y - 10,
                    width: 20,
                    height: 20,
                    'data-col-idx': colIdx + 1,
                    'xlink:href': 'data:image/png;base64,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'
                });
            }

            this.renderControl(elRegion, 'delete-col', {
                x: x - 10 + width / 2,
                y: y - 10,
                width: 20,
                height: 20,
                'data-col-idx': colIdx,
                'xlink:href': 'data:image/png;base64,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'
            });
        }
    },

    adjustRow: function(y, d) {

        this.paper.model.trigger('batch:start');

        var regions = _.cloneDeep(this.model.get('regions'));
        var row = regions.rows[y];
        row.height += d;
        this.model.set('regions', regions);

        // Move all the cards after the row by the extension `d`.
        var boardElements = _.without(this.paper.model.getElements(), this.model);
        var bbox = this.model.getRowBBox(y);
        // Move all the cards af that are after the removed column by the column width to the left.
        _.each(boardElements, function(el) {
            var center = g.rect(el.getBBox()).center();
            if (center.y > bbox.y) {
                el.translate(0, d);
            }
        });

        this.paper.model.trigger('batch:stop');
    },

    adjustColumn: function(x, d) {

        this.paper.model.trigger('batch:start');

        var regions = _.cloneDeep(this.model.get('regions'));
        var col = regions.cols[x];
        col.width += d;
        this.model.set('regions', regions);

        // Move all the cards after the column by the extension `d`.
        var boardElements = _.without(this.paper.model.getElements(), this.model);
        var bbox = this.model.getColBBox(x);
        // Move all the cards af that are after the removed column by the column width to the left.
        _.each(boardElements, function(el) {
            var center = g.rect(el.getBBox()).center();
            if (center.x > bbox.x) {
                el.translate(d);
            }
        });

        this.paper.model.trigger('batch:stop');
    },

    addRow: function(y) {

        var regions = _.cloneDeep(this.model.get('regions'));
        // In case there is no row at that index, we assume we want to add a new row at
        // the end which is a clone of the last row (the one before) (assert(`x` === rows.length)).
        var row = regions.rows[y] || regions.rows[y - 1];

        this.paper.model.trigger('batch:start');

        var newRow = _.clone(row);
        newRow.id = _.uniqueId('row-');
        regions.rows.splice(y, 0, newRow);
        this.model.set('regions', regions);

        // Move all the cards after the row by the height of the new row.
        var boardElements = _.without(this.paper.model.getElements(), this.model);
        var bbox = this.model.getRowBBox(y);
        // Move all the cards af that are after the removed column by the column width to the left.
        _.each(boardElements, function(el) {
            var center = g.rect(el.getBBox()).center();
            if (center.y > bbox.y) {
                el.translate(0, newRow.height);
            }
        });

        this.paper.model.trigger('batch:stop');
    },

    addColumn: function(x) {

        var regions = _.cloneDeep(this.model.get('regions'));
        // In case there is no column at that index, we assume we want to add a new column at
        // the end which is a clone of the last column (the one before) (assert(`x` === cols.length)).
        var col = regions.cols[x] || regions.cols[x - 1];

        this.paper.model.trigger('batch:start');

        var newCol = _.clone(col);
        newCol.id = _.uniqueId('col-');
        regions.cols.splice(x, 0, newCol);
        this.model.set('regions', regions);

        // Move all the cards after the column by the width of the new column.
        var boardElements = _.without(this.paper.model.getElements(), this.model);
        var bbox = this.model.getColBBox(x);
        // Move all the cards af that are after the removed column by the column width to the left.
        _.each(boardElements, function(el) {
            var center = g.rect(el.getBBox()).center();
            if (center.x > bbox.x) {
                el.translate(newCol.width);
            }
        });

        this.paper.model.trigger('batch:stop');
    },

    deleteColumn: function(x, check) {

        var boardElements = _.without(this.paper.model.getElements(), this.model);
        var inColumn = this.model.findElementsInColumn(boardElements, x);
        var canDelete = true;

        if (inColumn.length && check) {
            canDelete = confirm('There is some tasks inside the column. Are you sure you want to delete it?');
        }
        if (canDelete) {

            this.paper.model.trigger('batch:start');

            var bbox = this.model.getColBBox(x);
            // Move all the cards af that are after the removed column by the column width to the left.
            _.each(boardElements, function(el) {
                var center = g.rect(el.getBBox()).center();
                if (center.x > bbox.x) {
                    el.translate(-bbox.width);
                }
            });

            var regions = _.cloneDeep(this.model.get('regions'));
            regions.cols.splice(x, 1);
            this.model.set('regions', regions);
            _.invoke(inColumn, 'remove');

            this.paper.model.trigger('batch:stop');
        }
    },

    deleteRow: function(y, check) {


        var boardElements = _.without(this.paper.model.getElements(), this.model);
        var inRow = this.model.findElementsInRow(boardElements, y);
        var canDelete = true;

        if (inRow.length && check) {
            canDelete = confirm('There is some tasks inside the row. Are you sure you want to delete it?');
        }

        if (canDelete) {

            this.paper.model.trigger('batch:start');

            var rowBbox = this.model.getRowBBox(y);
            // Move all the cards af that are after the removed row by the row height to the top.
            _.each(boardElements, function(el) {
                var center = g.rect(el.getBBox()).center();
                if (center.y > rowBbox.y) {
                    el.translate(0, -rowBbox.height);
                }
            });

            var regions = _.cloneDeep(this.model.get('regions'));
            regions.rows.splice(y, 1);
            this.model.set('regions', regions);
            _.invoke(inRow, 'remove');

            this.paper.model.trigger('batch:stop');
        }
    },

    toggleControls: function() {

        V(this.el).toggleClass('show-controls');
    },

    // Interaction.
    // ------------

    pointerdown: function(evt, x, y) {

        if (this._longTapTimeout) {
            clearTimeout(this._longTapTimeout);
        }
        this._longTapTimeout = setTimeout(_.bind(this.longtap, this), 1000);

        var $handle = $(evt.target);

        if (!V(evt.target).hasClass('handle')) return;

        evt.stopPropagation();

        var $region = $handle.closest('.region');
        var size = this.model.get('size');
        var regions = this.model.get('regions');
        var colIdx = parseInt($handle.attr('data-col-idx'), 10);
        var rowIdx = parseInt($handle.attr('data-row-idx'), 10);

        var extension = 50;

        if (V(evt.target).hasClass('shrink-row')) {

            this.adjustRow(rowIdx, -extension);

        } else if (V(evt.target).hasClass('expand-row')) {

            this.adjustRow(rowIdx, extension);

        } else if (V(evt.target).hasClass('shrink-column')) {

            this.adjustColumn(colIdx, -extension);

        } else if (V(evt.target).hasClass('expand-column')) {

            this.adjustColumn(colIdx, extension);

        } else if (V(evt.target).hasClass('add-row')) {

            this.addRow(rowIdx);

        } else if (V(evt.target).hasClass('add-col')) {

            this.addColumn(colIdx);

        } else if (V(evt.target).hasClass('delete-col')) {

            this.deleteColumn(colIdx, true);

        } else if (V(evt.target).hasClass('delete-row')) {

            this.deleteRow(rowIdx, true);
        }
    },

    pointermove: function() {

        if (this._longTapTimeout) {
            clearTimeout(this._longTapTimeout);
        }
    },

    pointerup: function() {

        if (this._longTapTimeout) {
            clearTimeout(this._longTapTimeout);
        }
    },

    longtap: function() {

        this.toggleControls();
    },

    onMouseMove: function(evt) {
    },
    onMouseOut: function(evt) {
    }
});
