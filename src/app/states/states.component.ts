import { Component, OnInit, ViewChild, ElementRef,ViewEncapsulation  } from '@angular/core';
import {EsriService} from '../esri.service';
import {EsriClusterService} from '../services/esri-cluster.service';
import { Subscription } from 'rxjs';
import {IEvent} from '../iEvent';
import {ICity} from '../models/iCity';

@Component({
  selector: 'app-states',
  templateUrl: './states.component.html',
  styleUrls: ['./states.component.scss'],
  encapsulation: ViewEncapsulation.None,
  //providers: [ EsriService ]
  providers:[EsriClusterService]
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

  //constructor(private esriService : EsriService) { }
  constructor(private esriService : EsriClusterService) { }

  ngOnInit() {

    //--
    //this.esriService.create2DMap(this.mapViewEl.nativeElement);

    this.esriService.createMap(this.mapViewEl.nativeElement);

    this.esriService.mapInitialised$.subscribe(()=>{
      this.loadGraphics();
    });

    //--
    // this.esriService.featureCount$.subscribe((count: number)=>{
    //   this.featureCount = count;
    // });


    //--
    // this.esriService.cityLocation$.subscribe((location: ICity)=>{

    //   if (location.name !== "undefined,")
    //   this.cityLabel = location;
      
    // });

  }

  loadGraphics()
  {
    //debugger;

    //--
    //this.esriService.addFeatureLayer();

    //--
    //this.esriService.addCityData(this.selectedClient);

    //--
    this.esriService.addCityDataAsGraphicsLayer('client_1');
  }

  onChange($event)
   {
     this.selectedClient = $event.target.value;
     //debugger;
     //--
     //this.esriService.addCityData(this.selectedClient);
   }

   intersectClick()
   {
     //--
     //this.esriService.intersects();
   }

   removeClassification()
   {
     //--
   // this.esriService.removeStatesLayer();
   }


}
