import { TestBed } from '@angular/core/testing';

import { FilmListService } from './film-list.service';

describe('FilmListService', () => {
    let service: FilmListService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(FilmListService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
