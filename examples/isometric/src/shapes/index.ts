import { shapes } from 'jointjs';

import { Link } from './link/link'
import { Switch } from './switch/switch'
import { Router } from './router/router'
import { Computer } from './computer/computer'
import { Database } from './database/database'
import { ActiveDirectory } from './active-directory/active-directory'
import { User } from './user/user'
import { Firewall } from './firewall/firewall'

export const cellNamespace = {
    ...shapes,
    Link,
    Switch,
    Router,
    Computer,
    Database,
    ActiveDirectory,
    User,
    Firewall
}

export {
    Link,
    Switch,
    Router,
    Computer,
    Database,
    ActiveDirectory,
    User,
    Firewall
}
