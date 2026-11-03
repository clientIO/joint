import { provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

// The components update plain fields from JointJS event handlers, so change
// detection is driven by zone.js (Angular 21 runs zoneless by default).
bootstrapApplication(AppComponent, {
    providers: [provideZoneChangeDetection()],
}).catch((err) => console.error(err));
