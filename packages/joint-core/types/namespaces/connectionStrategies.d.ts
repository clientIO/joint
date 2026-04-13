import { connectionStrategies } from '../joint';

// Interfaces
export type ConnectionStrategy = connectionStrategies.ConnectionStrategy;

// Variables
export import useDefaults = connectionStrategies.useDefaults;
export import pinAbsolute = connectionStrategies.pinAbsolute;
export import pinRelative = connectionStrategies.pinRelative;
