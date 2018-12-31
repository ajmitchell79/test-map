import { Component, OnInit, ViewChild, ElementRef,ViewEncapsulation  } from '@angular/core';
import {EsriService} from '../esri.service';
import { Subscription } from 'rxjs';
import {IEvent} from '../iEvent';

@Component({
  selector: 'app-storm-tracks',
  templateUrl: './storm-tracks.component.html',
  styleUrls: ['./storm-tracks.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [ EsriService ]
})
export class StormTracksComponent implements OnInit {

  @ViewChild('mapViewNode') private mapViewEl: ElementRef;

  private mapInitialisedRef: Subscription = null;
  private twoDimension : boolean = false;
  private dimensionLabel: string = "2D";
  private stormEvent : IEvent;
  private IE: boolean;

  constructor(private esriService : EsriService) { }

  ngOnInit() {
    this.IE = this.checkIE();

    this.switchDimension();

    this.esriService.mapInitialised$.subscribe(()=>{

      let event = <IEvent>{eventID: 1234, 
        wkt: "LINESTRING (-77.0 24.5,-77.5 24.95,-78.0 25.4,-78.5 25.7,-79.0 26.0,-79.3 26.2,-79.6 26.4,-79.9 26.5,-80.2 26.6,-80.65 26.95,-81.1 27.3,-80.95 27.55,-80.8 27.8,-80.6 28.15,-80.4 28.5,-80.2 28.75,-80.0 29.0,-79.85 29.35,-79.7 29.7,-79.35 30.2,-79.0 30.7,-78.5 31.35,-78.0 32.0,-77.2 32.7,-76.4 33.4,-75.4 34.35,-74.4 35.3,-73.3 36.55,-72.2 37.8,-71.05 38.95,-69.9 40.1,-68.7 42.05,-67.5 44.0,-66.75 46.25,-66.0 48.5,-65.5 50.75,-65.0 53.0)"
      }
      this.switchGraphics(event);
    });
  }

  switchGraphics(event: IEvent)
  {
    this.twoDimension ? this.esriService.addStormGraphic2D(event) :  this.esriService.addStormGraphic3D(event);
    //this.esriService.addFeatureLayer();

    //this.esriService.addCityData(this.selectedClient);
  }

  switchDimension()
  {
    !this.twoDimension ? this.esriService.create2DMap(this.mapViewEl.nativeElement) :     this.esriService.create3DMap(this.mapViewEl.nativeElement);
    this.twoDimension ? this.dimensionLabel = "2D" : this.dimensionLabel = "3D";

    this.twoDimension = !this.twoDimension;
  }

  private checkIE(): boolean
  {
    // /debugger;
      var ua = window.navigator.userAgent;
      //sconsole.log(ua);
      return ua.indexOf('Trident/') > 0
  }

}
