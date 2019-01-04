import { TestBed } from '@angular/core/testing';

import { Esri3dService } from './esri-3d.service';

describe('Esri3dService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: Esri3dService = TestBed.get(Esri3dService);
    expect(service).toBeTruthy();
  });
});
