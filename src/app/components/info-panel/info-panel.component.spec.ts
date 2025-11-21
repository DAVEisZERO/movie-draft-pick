import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InfoPanelComponent } from './info-panel.component';

describe('InfoPanelComponent', () => {
    let component: InfoPanelComponent;
    let fixture: ComponentFixture<InfoPanelComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [InfoPanelComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(InfoPanelComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
