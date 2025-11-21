import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PrepareRouletteComponent } from './prepare-roulette.component';

describe('PrepareRouletteComponent', () => {
    let component: PrepareRouletteComponent;
    let fixture: ComponentFixture<PrepareRouletteComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [PrepareRouletteComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(PrepareRouletteComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
