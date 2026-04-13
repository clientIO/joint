import { routers } from '../joint';

// Interfaces
export type NormalRouterArguments = routers.NormalRouterArguments;
export type ManhattanRouterArguments = routers.ManhattanRouterArguments;
export type OrthogonalRouterArguments = routers.OrthogonalRouterArguments;
export type OneSideRouterArguments = routers.OneSideRouterArguments;
export type RouterArgumentsMap = routers.RouterArgumentsMap;
export type GenericRouter<K extends routers.RouterType> = routers.GenericRouter<K>;
export type GenericRouterJSON<K extends routers.RouterType> = routers.GenericRouterJSON<K>;
export type RightAngleRouterArguments = routers.RightAngleRouterArguments;
export type RightAngleRouter = routers.RightAngleRouter;

// Types
export type RouterType = routers.RouterType;
export type GenericRouterArguments<K extends routers.RouterType> = routers.GenericRouterArguments<K>;
export type RouterArguments = routers.RouterArguments;
export type Router = routers.Router;
export type RouterJSON = routers.RouterJSON;

// Enums
export import RightAngleDirections = routers.RightAngleDirections;

// Variables
export import manhattan = routers.manhattan;
export import metro = routers.metro;
export import normal = routers.normal;
export import orthogonal = routers.orthogonal;
export import oneSide = routers.oneSide;
export import rightAngle = routers.rightAngle;
