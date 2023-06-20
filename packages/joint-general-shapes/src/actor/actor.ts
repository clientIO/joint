import { Model } from '@joint/decorators';
import { dia } from '@joint/core';
import svg from './actor.svg';

interface ActorAttributes extends dia.Element.Attributes {
    bodyY: number;
    legsY: number;
}

@Model({
    attributes: {
        size: {
            width: 50,
            height: 100
        },
        bodyY: .4,
        legsY: .7,
        headY: .2
    },
    template: svg,
})
export class Actor extends dia.Element<ActorAttributes> {
}
