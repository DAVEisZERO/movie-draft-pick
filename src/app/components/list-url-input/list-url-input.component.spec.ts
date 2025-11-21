import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ListUrlInputComponent } from './list-url-input.component';

describe('ListUrlInputComponent', () => {
    let component: ListUrlInputComponent;
    let fixture: ComponentFixture<ListUrlInputComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [ListUrlInputComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ListUrlInputComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
