import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import {IEvent} from '../iEvent';
import {citydata} from '../data/city-data';

import { loadModules } from 'esri-loader';
import esri = __esri;

@Injectable({
  providedIn: 'root'
})
export class Esri2dService {

  private mapInitialisedSource = new Subject<void>();
  public mapInitialised$ = this.mapInitialisedSource.asObservable();

  private featureCountSource = new Subject<number>();
  public featureCount$ = this.featureCountSource.asObservable();

  _sceneView: esri.SceneView; 
  _map: esri.Map;
  _mapView: esri.MapView;
  _graphicsLayer: any; //esri.GraphicsLayer;
  _featureLayer: any; //esri.GraphicsLayer;

  _graphic: any; //esri.Graphic;

  _polygon: any; //esri.Geometry.Polygon;
  _point: any; //esri.Geometry.Point;

  _simpleLineSymbol: any;

  _mesh: any;

  //cityLayer: esri.GraphicsLayer;
  cityLayer: any;
  stateLayer: esri.FeatureLayer;
  _geometryEngine: esri.geometryEngine;

  classBreaksLayer: esri.GraphicsLayer;

  cityFeatures: any;
  cityGeometries: any;
  stateFeatures: any[] = [];

  stateTotals : any[] = [];

  constructor() { 
    //debugger;
  }

  public create2DMap(mapElement :any) 
  {
    //debugger;

    loadModules([
      'esri/Map',
      'esri/views/MapView',
      'esri/layers/GraphicsLayer',
      'esri/Graphic',
      "esri/symbols/SimpleLineSymbol",
      "esri/layers/FeatureLayer",
      "esri/geometry/geometryEngine"
    ])
      .then(([EsriMap, EsriMapView,EsriGraphicsLayer, EsriGraphic, EsriSimpleLineSymbol, EsriFeatureLayer, geometryEngine]) => {

        this._graphic = EsriGraphic;
        this._graphicsLayer = EsriGraphicsLayer;
        this._featureLayer = EsriFeatureLayer;
        this. _simpleLineSymbol = EsriSimpleLineSymbol;
        this._mapView = EsriMapView;
        //this._geometryEngine = new geometryEngine();
        this._geometryEngine = geometryEngine;

        // Set type for Map constructor properties
        const mapProperties: esri.MapProperties = {
         basemap: "hybrid"
        }; 

        this._map = new EsriMap({
          //basemap: "hybrid",
          basemap: "streets-night-vector",
      });

        // Set type for MapView constructor properties
        const mapViewProperties: esri.MapViewProperties = {
          container: mapElement,
          map: this._map
        };

        this._mapView = new EsriMapView(mapViewProperties);

        this._mapView.ui.remove(["attribution"]);

        this._mapView.when(() => {

          // All the resources in the MapView and the map have loaded. Now execute additional processes
          this.mapInitialisedSource.next();

        }, err => {
          console.error(err);
        });
      })
      .catch(err => {
        console.error(err);
      });
  }
  
  public addFeatureLayer()
  {
    if (this.stateLayer != null) return;

    let that = this;

    

    let renderer = {
      type: "simple",  // autocasts as new SimpleRenderer()
      symbol: {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: "transparent",
        style: "solid",
        outline: {
          width: 0.2,
          color:"#ff771d"
        }
      }
    };

    this.stateLayer = new this._featureLayer("https://services.arcgis.com/V6ZHFr6zdgNZuVG0/ArcGIS/rest/services/StateTerritoryBoundaries/FeatureServer/0",{
          mode: this._featureLayer.MODE_ONDEMAND,
          outFields: ["*"],
          definitionExpression: "TERR_TYPE = 'State' AND VERSION = 1",
          opacity: 1.0,
          renderer: renderer
        });

        this._map.add(this.stateLayer);

        //save state features for later on 
        this.stateLayer.on("layerview-create", function() {

          let query =  that.stateLayer.createQuery();
          query.returnGeometry = true;
          let result = that.stateLayer.queryFeatures(query).then(response =>
          {
            response.features.forEach(ftr=> {
              that.stateFeatures.push(ftr);
          })
        });
        });    
        
        //class breaks layer
        this.classBreaksLayer = new this._graphicsLayer()
        this._map.add(this.classBreaksLayer);
  }

  public intersects()
  {
    let that = this;

   // if (this.classBreaksLayer == null)
  //  {
    //    this.classBreaksLayer = new this._graphicsLayer()
    //    this._map.add(this.classBreaksLayer);
   // }

  //  this.cityLayer = new this._graphicsLayer();
    this.classBreaksLayer.graphics.removeAll();


    //loop through state features
    this.stateFeatures.forEach(ftr=> {

        let cityQuery =  this.cityLayer.createQuery();
        cityQuery.outFields = [ "name", "rating" ];
        cityQuery.geometry = ftr.geometry;
        cityQuery.spatialRelationship = "intersects";
        //cityQuery.returnGeometry = true;

       

          this.cityLayer.queryFeatures(cityQuery).then(result =>
          {
              let total =result.features.reduce((a, b) => +a + +b.attributes["rating"], 0);
              that.stateTotals.push({"state": ftr.attributes["ABBR_NAME"],"rating": total});
              console.log(ftr.attributes["ABBR_NAME"] + ", count: " + result.features.length + ", rating-total: " + total);

              var fillSymbol = {
                type: "simple-fill",  // autocasts as new SimpleMarkerSymbol()
                color: that.classifyState(total)
              };
  
              var stateGraphic = new this._graphic({
                geometry: ftr.geometry,
                symbol: fillSymbol
              });
  
              this.classBreaksLayer.graphics.add(stateGraphic);
            });
      });
  }

  private classifyState(totalRating: number) : string
  {
    if (totalRating >= 0 && totalRating < 25)
      return "rgb(170, 170, 170)";

      if (totalRating >= 25 && totalRating < 50)
      return "rgb(248, 227, 194)";

      if (totalRating >= 50 && totalRating < 100)
      return "rgb(229, 153, 140)";

      if (totalRating >= 101 && totalRating < 150)
      return "rgb(216, 104, 104)";

      if (totalRating >= 151 && totalRating < 200)
      return "rgb(175, 70, 93)";

      if (totalRating >= 200)
      return "rgb(135, 35, 81)";


  }

  public addCityData(clientName: string)
  {
    let that = this;

    //remove all class breaks layer graphics
    this.classBreaksLayer.graphics.removeAll();

    if (this.cityLayer != null)
    {
      this._map.remove(this.cityLayer);
    }

    let features = [];
    var count: number = 0;

    citydata[clientName].forEach(city=>
      {
        var point = {
          type: "point",  // autocasts as new Point()
          longitude: city.longitude,
          latitude: city.latitude
        };
        
        // Create a graphic and add the geometry and symbol to it
        var pointGraphic = new this._graphic({
          attributes : {"objectId":count, "name": "f"+ count, "rating": Math.floor(Math.random() * 11)},
          geometry: point,
        });
    
        features.push(pointGraphic);
        count++;
      });

      this.featureCountSource.next(features.length);

      let renderer = {
            type: "simple",  // autocasts as new SimpleRenderer()
            symbol: {
              type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
              size: 8,
              color: "#ff771d",
            }
          };
    
          this.cityLayer = new this._featureLayer({
            fields: [
              {
             name: "objectId",
             alias: "objectId",
             type: "oid"
             },
             {
               name: "name",
               alias: "name",
               type: "string"
               },
               {
                name: "rating",
                alias: "rating",
                type: "integer"
                }
         ],
           source: features,
           renderer: renderer
         });
    
        this._map.add(this.cityLayer);
     
      this._mapView.goTo(features).then(function () {
      //that._mapView.zoom = that._mapView.zoom - 1;
    });
  }

  public addCityDataAsGraphicsLayer(clientName: string)
  {
    let that = this;

    if (this.cityLayer == null)
    {
        this.cityLayer = new this._graphicsLayer()
        this._map.add(this.cityLayer);
    }

  //  this.cityLayer = new this._graphicsLayer();
    this.cityLayer.graphics.removeAll();

    //citydata.client_1.forEach(city=>
    citydata[clientName].forEach(city=>
      {
        var point = {
          type: "point",  // autocasts as new Point()
          longitude: city.longitude,
          latitude: city.latitude
        };
        
        // Create a symbol for drawing the point
        var markerSymbol = {
          type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
          color: '#ff771d'
        };
        
        // Create a graphic and add the geometry and symbol to it
        var pointGraphic = new this._graphic({
          geometry: point,
          symbol: markerSymbol
        });
    
        this.cityLayer.graphics.add(pointGraphic);
      });

   // this._map.add(this.cityLayer);

    //set view to exent of graphics layer
    this._mapView.goTo( this.cityLayer.graphics).then(function () {
    
      //that._mapView.zoom = that._mapView.zoom - 1;
    });
  }

  public addStormGraphic2D(event: IEvent)
  {
    let that = this;
    let layer = new this._graphicsLayer();
    this._map.add(layer);

    let paths = new Array();

    let pairs = event.wkt.replace('LINESTRING (','').replace(')','').split(",");

    pairs.forEach(pair =>
      {
        paths.push(pair.split(" ").map(Number));
      });

    let polyline = {
      type: "polyline", // autocasts as new Polyline()
      hasZ: true,
      paths: [paths]
    };

    var lineSymbol = new this._simpleLineSymbol({
      color: '#ff771d',
      width: 4
    });


     let polylineGraphic = new this._graphic({
       geometry: polyline,
       symbol: lineSymbol
     });

     layer.add(polylineGraphic);

       //set view to exent of graphics layer
       this._mapView.goTo(layer.graphics).then(function () {
       
        that._mapView.zoom = that._mapView.zoom - 1;
    });

  }
}
