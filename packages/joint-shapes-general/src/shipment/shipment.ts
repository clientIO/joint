import { Model, Function } from '@joint/decorators';
import { dia } from '@joint/core';
import svg from './shipment.svg';

interface ShipmentAttributes extends dia.Element.Attributes {
    color: string;
}

@Model({
    attributes: {
        size: {
            width: 70,
            height: 50
        },
        color: '#333333',
    },
    template: svg,
})
export class Shipment extends dia.Element<ShipmentAttributes> {

    @Function('image')
    getImageUrl(color: string) {
        const svg = /* xml */`
            <?xml version="1.0" ?>
            <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
            <path
                fill="${color}"
                d="M248,119.9v-.2a1.7,1.7,0,0,0-.1-.7v-.3c0-.2-.1-.4-.1-.6v-.2l-.2-.8h-.1l-14-34.8A15.7,15.7,0,0,0,218.6,72H184V64a8,8,0,0,0-8-8H24A16,16,0,0,0,8,72V184a16,16,0,0,0,16,16H37a32,32,0,0,0,62,0h58a32,32,0,0,0,62,0h13a16,16,0,0,0,16-16V120ZM184,88h34.6l9.6,24H184ZM24,72H168v64H24ZM68,208a16,16,0,1,1,16-16A16,16,0,0,1,68,208Zm120,0a16,16,0,1,1,16-16A16,16,0,0,1,188,208Z"
            />
            </svg>
        `;

        return `data:image/svg+xml;base64,${window.btoa(svg.trim())}`;
    }
}
