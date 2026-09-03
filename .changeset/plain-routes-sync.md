---
"@joint/router-avoid": minor
---

RouterService - add `routeAllSync()` and `routeSubgraphSync()`: synchronous one-shot passes for the main-thread provider - every route is on its link by the time they return and errors throw out of the call, and instead of routing events they return the routed links with their `origin`/`reason` (`RoutedLink[]`); they throw when a Worker provider is in use, when a `routeAll()`/`routeSubgraph()` pass is still in flight, or after `destroy()`
