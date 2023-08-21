import { shapes } from 'jointjs';
import Node from "./nodes/Node";
import Multiplexer from "./cards/Multiplexer";
import Demultiplexer from './cards/Demultiplexer';
import ROADMultiplexer from "./cards/ROADMultiplexer";
import OpticalPowerMonitoring from './cards/OpticalPowerMonitoring';
import FiberProtectionUnit from "./cards/FiberProtectionUnit";
import RightAmplifier from "./cards/RightAmplifier";
import LeftAmplifier from "./cards/LeftAmplifier";
import Link from "./links/Link";
import NodeLink from "./links/NodeLink";
import FiberLink from "./links/FiberLink";
import ExternalLink from "./links/ExternalLink";
import { Card, CardView } from "./cards/Card";

export {
    Node,
    Card,
    Multiplexer,
    Demultiplexer,
    ROADMultiplexer,
    OpticalPowerMonitoring,
    RightAmplifier,
    LeftAmplifier,
    FiberProtectionUnit,
    Link,
    NodeLink,
    FiberLink,
    ExternalLink,
}

// The card view is the same for all cards. It makes sure that the link is reconnected
// to the parent node when the card is hidden (the parent is collapsed).

export const cellNamespace = {
    ...shapes,
    ngv: {
        // ngv.Node
        Node,
        // ngv.Multiplexer
        Multiplexer,
        MultiplexerView: CardView,
        // ngv.Demultiplexer
        Demultiplexer,
        DemultiplexerView: CardView,
        // ngv.ROADMultiplexer
        ROADMultiplexer,
        ROADMultiplexerView: CardView,
        // ngv.OpticalPowerMonitoring
        OpticalPowerMonitoring,
        OpticalPowerMonitoringView: CardView,
        // ngv.FiberProtectionUnit
        FiberProtectionUnit,
        FiberProtectionUnitView: CardView,
        // ngv.RightAmplifier
        RightAmplifier,
        RightAmplifierView: CardView,
        // ngv.LeftAmplifier
        LeftAmplifier,
        LeftAmplifierView: CardView,
        // ngv.Link
        Link,
        // ngv.NodeLink
        NodeLink,
        // ngv.FiberLink
        FiberLink,
        // ngv.ExternalLink
        ExternalLink,
    }
};
