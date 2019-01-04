import { TestBed } from '@angular/core/testing';

import { Esri2dService } from './esri-2d.service';

describe('Esri2dService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: Esri2dService = TestBed.get(Esri2dService);
    expect(service).toBeTruthy();
  });
});
