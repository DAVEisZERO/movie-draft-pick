import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewScoringComponent } from './review-scoring.component';

describe('ReviewScoringComponent', () => {
    let component: ReviewScoringComponent;
    let fixture: ComponentFixture<ReviewScoringComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [ReviewScoringComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ReviewScoringComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
