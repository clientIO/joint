QUnit.module('embedding-layers', function(hooks) {

    hooks.beforeEach(function() {

        const fixtureEl = fixtures.getElement();
        const paperEl = document.createElement('div');
        fixtureEl.appendChild(paperEl);
        this.graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        this.paper = new joint.dia.Paper({
            el: paperEl,
            model: this.graph,
            cellViewNamespace: joint.shapes,
            useLayersForEmbedding: true
        });
    });

    QUnit.test('Embedding layers setup', function(assert) {

        assert.ok(this.paper.embeddingLayersController, 1, 'Controller is created');
    });

    hooks.afterEach(function() {

        this.paper.remove();
        this.graph = null;
        this.paper = null;
    });
});
