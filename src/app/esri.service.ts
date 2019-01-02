import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import {IEvent} from './iEvent';
import {citydata} from './data/city-data';

import { loadModules } from 'esri-loader';
import esri = __esri;

@Injectable({
  providedIn: 'root'
})
export class EsriService {

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

  _polygonSymbol3D: any;
  _extrudeSymbol3DLayer: any;
  _objectSymbol3DLayer: any;
  _lineSymbol3D: any;
  _pathSymbol3DLayer : any;
  _simpleLineSymbol: any;

  _mesh: any;

  //cityLayer: esri.GraphicsLayer;
  cityLayer: any;
  stateLayer: esri.FeatureLayer;
  _geometryEngine: esri.geometryEngine;

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

    this.stateLayer = new this._featureLayer("https://services.arcgis.com/V6ZHFr6zdgNZuVG0/ArcGIS/rest/services/StateTerritoryBoundaries/FeatureServer/0",{
          mode: this._featureLayer.MODE_ONDEMAND,
          outFields: ["*"],
          definitionExpression: "TERR_TYPE = 'State' AND VERSION = 1",
          opacity: 0.5
        });

        this._map.add(this.stateLayer); 
  }

  //******************************************************** */
  //loop through all the state layer graphics, intersect with points layer, sum the TIV
  //********************************************************** */

  public intersects()
  {

    let that = this;
     
              let query =  this.stateLayer.createQuery();
             // query.where = "TERR_TYPE = 'State'";
              let result = this.stateLayer.queryFeatures(query).then(function(response)
              {
              
                  let x = response;
                  //response.features[0].attributes

                  //*********************************************************** */
                  // - loop through each point
                  // - loop through all states until it intersects, THEN EXIT LOOP as youve found the intersetct
                  //******************************************************************* */

                  that.cityLayer.graphics.items.forEach(graphic=>
                    {
                      
                      response.features.forEach(feature=>
                        {
                          console.log('intersecting ' + feature.attributes["NAME"]);
                          //if found, break loop

                          if(that._geometryEngine.intersects(feature.geometry, graphic.geometry))
                          {
                            console.log('found');
                          }

                        });

                    });

                //works
                // response.features.forEach(feature=>
                //   {
                //     debugger;
                    
                //     try{
                //       var result = that._geometryEngine.intersects(feature.geometry, that.cityLayer.graphics.items[0].geometry);
                //     }
                //     catch(err) {
                //      console.log(err);
                //     }

                   

                    
                //   });
                  
              })

  }

  public addCityData(clientName: string)
  {
    let that = this;

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
          attributes : {"objectId":count, "name": "f"+ count},
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

  public create3DMap(mapElement :any)
  {
    loadModules([
      'esri/Map',
      'esri/views/MapView',
      'esri/views/SceneView',
      'esri/layers/GraphicsLayer',
      'esri/Graphic',
      "esri/geometry/Polygon",
      'esri/geometry/Point',
      'esri/symbols/PolygonSymbol3D',
      'esri/symbols/ExtrudeSymbol3DLayer',
      'esri/symbols/ObjectSymbol3DLayer',
      'esri/symbols/LineSymbol3D',
      'esri/symbols/PathSymbol3DLayer',
      'esri/geometry/Mesh'
    ])
      .then(([EsriMap, EsriMapView, EsriSceneView, EsriGraphicsLayer, EsriGraphic, EsriPolygon,EsriPoint, 
        EsriPolygonSymbol3D, EsriExtrudeSymbol3DLayer, EsriObjectSymbol3DLayer, EsriLineSymbol3D, EsriPathSymbol3DLayer, EsriMesh]) => {

        this._extrudeSymbol3DLayer = EsriExtrudeSymbol3DLayer;
        this._polygonSymbol3D = EsriPolygonSymbol3D;
        this._objectSymbol3DLayer = EsriObjectSymbol3DLayer;
        this._lineSymbol3D = EsriLineSymbol3D;
        this._pathSymbol3DLayer = EsriPathSymbol3DLayer;
        
        this._graphic = EsriGraphic;

        this._mesh = EsriMesh;

        this._graphicsLayer = EsriGraphicsLayer;

        this._polygon = EsriPolygon;
        this._point = EsriPoint;

        //let g = new esri.Graphic();

        this._map = new EsriMap({
            basemap: "streets-night-vector",
           //basemap: "gray",
            //basemap: "streets",
           // basemap: "hybrid",
            ground: "world-elevation"
       });

        this._sceneView = new EsriSceneView({
          container:mapElement,     
          map: this._map,                
            camera: { 
             // position: [
            //     //  -0.08156023780775738, // lon, left and right
            //     //  51.50904072030298, // lat, up and down

            //  //   2.336006, 48.860818,
            //  //     550  // elevation in meters
            //   ],
              position: [
                -42.6558807904036,
                14.255639363412671,
                3298782  
            ],
              tilt:22.4229
              //tilt:20.4229
          }
      });
     
      this._sceneView.when(() => {
          // All the resources in the MapView and the map have loaded. Now execute additional processes
          this.mapInitialisedSource.next();

         this.addCityGraphics();

        }, err => {
          console.error(err);
        });

      })
      .catch(err => {
        console.error(err);
      });
  }

  public addStormGraphic3D(event: IEvent)
  {
    let that = this;
    let layer = new this._graphicsLayer();
    this._map.add(layer);

    let paths = new Array();

    //debugger;
    let pairs = event.wkt.replace('LINESTRING (','').replace(')','').split(",");

    //debugger;

    pairs.forEach(pair =>
      {
        let coord = pair.split(" ").map(Number);

        var point = new this._point(
          {
           latitude: coord[1],
           longitude: coord[0]
          });
  
          var pointGraphic = new this._graphic({
            geometry: point,
           symbol: this.generateCylinderSymbol2((Math.floor(Math.random() * 32) + 10) *10000)
          }); 
         
          layer.add(pointGraphic);
      });

     // debugger;
   
      this._sceneView.goTo(layer.graphics).then(function () {
       
        //that._sceneView.zoom = that._sceneView.zoom - 1;
        //that._sceneView.camera.tilt = 14.8777;
        let camera = that._sceneView.camera.clone();
        //camera.tilt = 10;

        that._sceneView.camera = camera;

    });

  }

  private addCityGraphics()
 {
   let layer = new this._graphicsLayer();
   this._map.add(layer);

   //willis 
   var willisPolygon1 = new this._polygon(
     {
           rings: [
        [[-0.08175,51.51317],
          [-0.08154,51.51308],//
          [-0.08184,51.51264],
            [-0.08206,51.51267],
          [-0.08184,51.51288],
         [-0.08175,51.51317]
           ],
         ]}) ; //,

 var willisPolygon2 = new this._polygon(
     {
           rings: [
        [
             [-0.08154,51.51308],
             [-0.08132,51.51299],
             [-0.08161,51.51262],
              [-0.08184,51.51264],
               [-0.08160,51.51284],
             [-0.08154,51.51308]
           ]
         ]}) ; //,

var willisPolygon3 = new this._polygon(
     {
           rings: [
              [
             [-0.08132,51.51299],
             [-0.08112,51.51286],
           [-0.08116,51.51272],
             [-0.08128,51.51263],
               [-0.08161,51.51262],
             [-0.08137,51.51278],
             [-0.08132,51.51299]
           ]
         ]}) ; //,

         var willisPolygon4 = new this._polygon(
           {
                 rings: [
                    [
                   [-0.081062,51.512905],
                   [-0.080488,51.512988],
                 [-0.080370,51.512631],
                   [-0.080826,51.512588],
                     [-0.080992,51.512711],
                   [-0.081062,51.512905],
                 ]
               ]})

   var willisGraphic1 = new this._graphic({
     geometry: willisPolygon1,
     symbol: this.generateExtrudeSymbol("#9E559C",75)
   }); 
     
   layer.add(willisGraphic1);

     var willisGraphic2 = new this._graphic({
     geometry: willisPolygon2,
     symbol: this.generateExtrudeSymbol("#9E559C",105)
   }); 
     
   layer.add(willisGraphic2);

     var willisGraphic3 = new this._graphic({
     geometry: willisPolygon3,
     symbol: this.generateExtrudeSymbol("#9E559C",130)
   }); 
     
   layer.add(willisGraphic3);

    var willisGraphic4 = new this._graphic({
     geometry: willisPolygon4,
     symbol: this.generateExtrudeSymbol("#9E559C",50)
   }); 
     
   layer.add(willisGraphic4);


   //aviva
   var avivaPolygon = new this._polygon(
     {
       rings: [
          [
         [-0.081866,51.514461],
         [-0.081330,51.514457],
       [-0.081335,51.514117],
         [-0.081872,51.514133],
           [-0.081866,51.514461],
       ]
     ]});

     var avivaGraphic = new this._graphic({
       geometry: avivaPolygon,
       symbol: this.generateExtrudeSymbol("#00F",170)
     }); 

     layer.add(avivaGraphic);

   //-- gherkin
   var gherkinPoint = new this._point(
     {
      latitude: 51.514495,
      longitude: -0.080311
     });

   var gherkinGraphic = new this._graphic({
     geometry: gherkinPoint,
     symbol: this.generateCylinderSymbol()
   }); 
     
    layer.add(gherkinGraphic);

   //--  cheesegrater
   var cheesegraterPolygon = new this._polygon(
     {
       rings: [
          [
         [-0.082679,51.513983],
         [-0.081947,51.513990],
       [-0.081931,51.513613],
         [-0.082628,51.513593],
           [-0.082679,51.513983],
       ]
     ]});

   var cheesegraterGraphic = new this._graphic({
     geometry: cheesegraterPolygon,
     //symbol: this.generateExtrudeSymbol("#FF0",150)
     symbol: this.generateTetrahedronSymbol2()
   }); 
     
   layer.add(cheesegraterGraphic);

   //-- shard
   var shardPolygon = new this._point(
     {
      latitude: 51.504509,
      longitude: -0.086517
     });


   var shardGraphic = new this._graphic({
     geometry: shardPolygon,
     symbol: this.generateTetrahedronSymbol()
   }); 
   
   layer.add(shardGraphic);

   //---------- walkie ----------------
   var walkiePolygon = new this._polygon(
     {
       rings: [
         [
         [-0.083862,51.511599],
         [-0.083116,51.511496],
         [-0.083266,51.510915],
         [-0.084044,51.511005],
         [-0.083862,51.511599],
       ]
     ]}
   );

   var walkieGraphic = new this._graphic({
     geometry: walkiePolygon,
     symbol: this.generateExtrudeSymbol("#00FF00",170)
   });   

   layer.add(walkieGraphic);
   
  
 }

 private generateTetrahedronSymbol2()
  {
    var res =  {
     type: "point-3d",  // autocasts as new PointSymbol3D()
     symbolLayers: [{
       type: "object",  // autocasts as new ObjectSymbol3DLayer()
       width: 65,  // diameter of the object from east to west in meters
       height: 220,  // height of the object in meters
       depth: 65,  // diameter of the object from north to south in meters
      resource: { primitive: "tetrahedron" },
       material: { color: "yellow" }
     }]
   };
 
   return res;
 
  }

  private generateCylinderSymbol()
  {
    var res =  {
     type: "point-3d",  // autocasts as new PointSymbol3D()
     symbolLayers: [{
       type: "object",  // autocasts as new ObjectSymbol3DLayer()
       width: 55,  // diameter of the object from east to west in meters
       height: 250,  // height of the object in meters
       depth: 55,  // diameter of the object from north to south in meters
      resource: { primitive: "sphere" },
       material: { color: "red" }
     }]
   };
 
   return res;
 
  }

  private generateExtrudeSymbol(color, size){
    return new this._polygonSymbol3D({
      symbolLayers: [new this._extrudeSymbol3DLayer({
        size: size,
        material: { color: color }
      })]
    }); 
  }

  private generateTetrahedronSymbol()
  {
    var res =  {
     type: "point-3d",  // autocasts as new PointSymbol3D()
     symbolLayers: [{
       type: "object",  // autocasts as new ObjectSymbol3DLayer()
       width: 75,  // diameter of the object from east to west in meters
       height: 350,  // height of the object in meters
       depth: 75,  // diameter of the object from north to south in meters
      resource: { primitive: "tetrahedron" },
       material: { color: "dodgerblue" }
     }]
   };
 
   return res;
 
  }

  private generateCylinderSymbol2(height :number)
 {
   var res =  {
    type: "point-3d",  // autocasts as new PointSymbol3D()
    symbolLayers: [{
      type: "object",  // autocasts as new ObjectSymbol3DLayer()
      width: 64000,  // diameter of the object from east to west in meters
      height:height,
    //  height: 320000,  // height of the object in meters
      depth: 64000,  // diameter of the object from north to south in meters
     resource: { primitive: "cylinder" },
      material: { color: "#ff771d" }
    }]
  };

  return res;

 }

}
