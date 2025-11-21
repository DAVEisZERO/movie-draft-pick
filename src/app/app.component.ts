import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { IonApp, IonMenu, IonRouterOutlet, MenuController } from '@ionic/angular/standalone';
import { Storage } from '@ionic/storage-angular';
import { register } from 'swiper/element/bundle';
import { environment } from '../environments/environment';
import { InfoPanelComponent } from './components/info-panel/info-panel.component';
import { InfoPanelService } from './services/info-panel.service';
import { switchMap, catchError, Observable, tap, of, timeout, timer, expand } from 'rxjs';

register();

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    standalone: true,
    imports: [IonMenu, InfoPanelComponent, IonApp, IonRouterOutlet],
})
export class AppComponent {
    constructor(
        private readonly storage: Storage,
        private readonly http: HttpClient,
        private readonly menuCtrl: MenuController,
        private readonly infoPanelService: InfoPanelService,
    ) {
        this.storage.create();
        this.initializeBackendHealthCheck();
    }

    private initializeBackendHealthCheck(): void {
        const minInterval = 60000;
        const maxInterval = 90000;
        const getRandomDelay = () => Math.floor(Math.random() * (maxInterval - minInterval)) + minInterval;

        this.checkBackendHealth()
            .pipe(
                expand(() => {
                    const delay = getRandomDelay();
                    return timer(delay).pipe(switchMap(() => this.checkBackendHealth()));
                }),
            )
            .subscribe();
    }

    private checkBackendHealth(): Observable<{ status: string; timestamp: string; service: string }> {
        return this.http
            .get<{ status: string; timestamp: string; service: string }>(`${environment.backendUrl}/health`)
            .pipe(
                timeout({
                    first: 500,
                    with: () =>
                        of({
                            status: 'down',
                            timestamp: new Date().toISOString(),
                            service: 'letterboxd-list-scraper',
                        }),
                }),
                catchError((error) => {
                    console.error('Got error from backend health check:', error);
                    return of({
                        status: 'error',
                        timestamp: new Date().toISOString(),
                        service: 'letterboxd-list-scraper',
                    });
                }),
                tap((response) => {
                    console.info(
                        `${response.service} status is ${response.status.toUpperCase()} at ${response.timestamp}`,
                    );
                }),
            );
    }

    async onPanelDismiss() {
        await this.menuCtrl.enable(false);
        this.infoPanelService.clearPanel();
    }
}
