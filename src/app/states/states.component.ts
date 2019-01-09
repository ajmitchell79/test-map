import { Component, OnInit, ViewChild, ElementRef,ViewEncapsulation  } from '@angular/core';
import {EsriService} from '../esri.service';
import { Subscription } from 'rxjs';
import {IEvent} from '../iEvent';
import {ICity} from '../models/iCity';

@Component({
  selector: 'app-states',
  templateUrl: './states.component.html',
  styleUrls: ['./states.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [ EsriService ]
})
export class StatesComponent implements OnInit {

  @ViewChild('mapViewNode') private mapViewEl: ElementRef;

  private mapInitialisedRef: Subscription = null;
  selectedClient: string = "client_1";
  public clients : string[] = ["client_1", "client_2", "client_3"];

  private featureCountRef: Subscription = null;
 
  featureCount: number;

  private cityLocationRef: Subscription = null;
  cityLabel: ICity;

  constructor(private esriService : EsriService) { }

  ngOnInit() {

    this.esriService.create2DMap(this.mapViewEl.nativeElement);

    this.esriService.mapInitialised$.subscribe(()=>{
      this.loadGraphics();
    });

    this.esriService.featureCount$.subscribe((count: number)=>{
      this.featureCount = count;
    });


    this.esriService.cityLocation$.subscribe((location: ICity)=>{
      this.cityLabel = location;
    });

  }

  loadGraphics()
  {
    //debugger;

    this.esriService.addFeatureLayer();

    this.esriService.addCityData(this.selectedClient);
  }

  onChange($event)
   {
     this.selectedClient = $event.target.value;
     //debugger;
     this.esriService.addCityData(this.selectedClient);
   }

   intersectClick()
   {
     this.esriService.intersects();
   }

   removeClassification()
   {
    //this.esriService.removeClassifyLayer();
    this.esriService.removeStatesLayer();
   }


}
