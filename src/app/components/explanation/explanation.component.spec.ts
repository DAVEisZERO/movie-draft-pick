import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ExplanationComponent } from './explanation.component';

describe('ExplanationComponent', () => {
    let component: ExplanationComponent;
    let fixture: ComponentFixture<ExplanationComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [ExplanationComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ExplanationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
