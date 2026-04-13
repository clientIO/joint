import { connectors } from '../joint';

// Interfaces
export type NormalConnectorArguments = connectors.NormalConnectorArguments;
export type RoundedConnectorArguments = connectors.RoundedConnectorArguments;
export type SmoothConnectorArguments = connectors.SmoothConnectorArguments;
export type JumpOverConnectorArguments = connectors.JumpOverConnectorArguments;
export type StraightConnectorArguments = connectors.StraightConnectorArguments;
export type CurveConnectorArguments = connectors.CurveConnectorArguments;
export type ConnectorArgumentsMap = connectors.ConnectorArgumentsMap;
export type GenericConnector<K extends connectors.ConnectorType> = connectors.GenericConnector<K>;
export type GenericConnectorJSON<K extends connectors.ConnectorType> = connectors.GenericConnectorJSON<K>;
export type CurveConnector = connectors.CurveConnector;

// Types
export type ConnectorType = connectors.ConnectorType;
export type GenericConnectorArguments<K extends connectors.ConnectorType> = connectors.GenericConnectorArguments<K>;
export type ConnectorArguments = connectors.ConnectorArguments;
export type Connector = connectors.Connector;
export type ConnectorJSON = connectors.ConnectorJSON;

// Enums
export import CurveDirections = connectors.CurveDirections;
export import CurveTangentDirections = connectors.CurveTangentDirections;

// Variables
export import normal = connectors.normal;
export import rounded = connectors.rounded;
export import smooth = connectors.smooth;
export import jumpover = connectors.jumpover;
export import straight = connectors.straight;
export import curve = connectors.curve;
