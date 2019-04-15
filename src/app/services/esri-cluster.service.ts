import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import {IEvent} from '../iEvent';
import {citydata} from '../data/city-data';

import { loadModules } from 'esri-loader';
import esri = __esri;

@Injectable({
  providedIn: 'root'
})
export class EsriClusterService {

    private mapInitialisedSource = new Subject<void>();
    public mapInitialised$ = this.mapInitialisedSource.asObservable();

    private featureCountSource = new Subject<number>();
    public featureCount$ = this.featureCountSource.asObservable();

  _map: esri.Map;
  _mapView: esri.MapView;
  _graphicsLayer: any; //esri.GraphicsLayer;
  _featureLayer: any; //esri.GraphicsLayer;

  _graphic: any; //esri.Graphic;

  _polygon: any; //esri.Geometry.Polygon;
  _point: any; //esri.Geometry.Point;

  _simpleLineSymbol: any;

  cityLayer: any;
  _geometryEngine: esri.geometryEngine;
  _textSymbol: any;
  _popupTemplate:any;

  _esriPoint:any;

  _clusters:any = [];  //the actual clusters
  _clusterData:any =[]; //the individual points

  _clusterResolution:any;
  _visitedExtent: any = null;
  
  //TODO: look at the size of this
  //************************************************* */
  _clusterTolerance = 50; //options.distance || 50; TODO:should this go back in? 

  _singleSym :any;
  _simpleMarkerSymbol:any;;
  _dojoColor:any

  _font :any;
  _watchUtils:any;;
  _webMercatorUtils: any

  constructor() { 
    //debugger;
  }

  public createMap(mapElement :any) 
  {
        loadModules([
            'esri/Map',
            'esri/views/MapView',
            'esri/layers/GraphicsLayer',
            'esri/Graphic',
            "esri/symbols/SimpleLineSymbol",
            "esri/layers/FeatureLayer",
            "esri/geometry/geometryEngine",
            'esri/geometry/Point',
            'esri/symbols/TextSymbol',
            'esri/geometry/Polygon',
            'esri/symbols/SimpleMarkerSymbol',
            'dojo/_base/Color',
            'esri/symbols/Font',
            'esri/core/watchUtils',
            'esri/geometry/support/webMercatorUtils',
            'esri/PopupTemplate'
          ])
            .then(([EsriMap, EsriMapView,EsriGraphicsLayer, EsriGraphic, EsriSimpleLineSymbol, 
                EsriFeatureLayer, geometryEngine,
                EsriPoint, TextSymbol,Polygon,SimpleMarkerSymbol, dojoColor,Font,watchUtils,
                webMercatorUtils,popupTemplate
            ]) => {

        this._graphic = EsriGraphic;
        this._graphicsLayer = EsriGraphicsLayer;
        this._featureLayer = EsriFeatureLayer;
        this. _simpleLineSymbol = EsriSimpleLineSymbol;
        this._mapView = EsriMapView;
        this._geometryEngine = geometryEngine;

        this._esriPoint = EsriPoint;
        this._textSymbol = TextSymbol;
        this._polygon = Polygon;
        this._simpleMarkerSymbol  = SimpleMarkerSymbol;
        this._dojoColor = dojoColor;
        this._font = Font;
        this._watchUtils = watchUtils;
        this._webMercatorUtils = webMercatorUtils;
        this._popupTemplate = popupTemplate;

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

        let that = this;

        this._mapView.when(() => {

          // All the resources in the MapView and the map have loaded. Now execute additional processes
          this.mapInitialisedSource.next();

           //https://developers.arcgis.com/javascript/latest/sample-code/sandbox/index.html?sample=watch-for-changes
           //extent change
          watchUtils.whenTrue(this._mapView, "stationary", function() {

           // debugger;
            that.reCluster();
            
            // Get the new center of the view only when view is stationary.
            if (that._mapView.center) {
              var info = "<br> <span> the view center changed. </span> x: " +
              that._mapView.center.x.toFixed(2) + " y: " + that._mapView.center.y.toFixed(2);

              //console.log(info);
               // debugger;
            }
            // Get the new extent of the view only when view is stationary.
          });
        }, err => {
          console.error(err);
        });

        this._mapView.popup.autoOpenEnabled = false;

        this._mapView.on("click", function (event) {
            // debugger;

            let screenPoint = {x: event.x,y: event.y};

            that._mapView.hitTest(screenPoint).then(function (response) {
                if (response.results.length) {
                 var graphic = response.results.filter(function (result) {
                  // check if the graphic belongs to the layer of interest
                  return result.graphic.layer === that.cityLayer;
                 })[0].graphic;
                 // do something with the result graphic
                 console.log(graphic.attributes);

                 that._mapView.popup.content = "Id: " + graphic.attributes["clusterId"] 
                 + "<br/>Count: " + graphic.attributes["clusterCount"]
                 + "<br/>City: " + graphic.attributes["city"]
                 + "<br/>Population: " + graphic.attributes["population"];

                 that._mapView.popup.open({
                            title: "Cluster Details",
                            location: event.mapPoint // Set the location of the popup to the clicked location
                          });
                }
               });

             
                    // that._mapView.popup.content =
                    //     "No address was found for this location";

                    //     that._mapView.popup.open({
                    //         // Set the popup's title to the coordinates of the location
                    //         title: "Details",
                    //         location: event.mapPoint // Set the location of the popup to the clicked location
                    //       });
        });

        //--
        this._singleSym = new SimpleMarkerSymbol('circle', 16,
            new EsriSimpleLineSymbol(EsriSimpleLineSymbol.STYLE_SOLID, new dojoColor([85, 125, 140, 1]), 3), //TODO: is EsriSimpleLineSymbol.STYLE_SOLID correct?
            new dojoColor([255, 255, 255, 1]));

       this._font = new Font('10pt'); //.setFamily('Arial');


      })
      .catch(err => {
        console.error(err);
      });
  }

  public addCityDataAsGraphicsLayer(clientName: string)
  {
    let that = this;

    //NOTE: citylayer is used for the clustered graphics now
    if (this.cityLayer == null)
    {
        this.cityLayer = new this._graphicsLayer()
        this._map.add(this.cityLayer);
    }

    //in case theres any graphics in the layer
    this.cityLayer.graphics.removeAll();

    //load city data from json file for now
    citydata[clientName].forEach(city=>
      {
        var point = {
          type: "point",  // autocasts as new Point()
          longitude: city.longitude,
          latitude: city.latitude
        };
        
        // Create a graphic and add the geometry and symbol to it
        var pointGraphic = new this._graphic({
          geometry: point,
          attributes : {
              clusterId:null, 
              city: city.city,
              population: parseInt(city.population)},
        });

        //_clusterData is the list of individual points, which will be turned into clusters
        this._clusterData.push(pointGraphic);
      });

      //recluster, which will create the clusters
      this.reCluster();

    //set view to exent of graphics layer
    this._mapView.goTo( this.cityLayer.graphics).then(function () {
    
      that._mapView.zoom = that._mapView.zoom - 2;
    });
  }

  // Build new cluster array from features and draw graphics
  public clusterGraphics() {
//    debugger;
    // TODO - should test if this is a pan or zoom level change before reclustering
    // Remove all existing graphics from layer
    this.clear();

    // test against a modified/scrubbed map extent polygon geometry
    var testExtent = this.getNormalizedExtentsPolygon();

    // first time through, loop through the points
    for ( var j = 0, jl = this._clusterData.length; j < jl; j++ ) {
        // see if the current feature should be added to a cluster
        var point = this._clusterData[j].geometry || this._clusterData[j];
        // TEST - Only cluster what's in the current extent.  TODO - better way to do this?
        if (!testExtent.contains(point)) {
            // Reset all other clusters and make sure their id is changed
            this._clusterData[j].attributes.clusterId = -1;
            continue;
        }
        var feature = this._clusterData[j];
        var clustered = false;
        // Add point to existing cluster
        for ( var i = 0; i < this._clusters.length; i++ ) {
            var c = this._clusters[i];
            if ( this.clusterTest(point, c) ) {
                this.clusterAddPoint(feature, point, c);
                clustered = true;
                // TODO - try to update center of cluster - poor results, should use a grid system
                // var pts = new Multipoint(this._map.spatialReference);
                // pts.addPoint(new Point(c.x, c.y));
                // pts.addPoint(point);
                // var center = pts.getExtent().getCenter();
                // c.x = center.x;
                // c.y = center.y;
                break;
            }
        }
        // Or create a new cluster (of one)
        if (!clustered) {
            debugger;
            this.clusterCreate(feature, point);
        }
    }

    this.showAllClusters();
}

    private clear() {
        this._clusters.length = 0;
       this.cityLayer.graphics.removeAll();
    }

    private clusterAddPoint(feature :any, p:any, cluster:any) {
       
        // Average in the new point to the cluster geometry
        var count, x, y;
        count = cluster.attributes.clusterCount;
        x = (p.x + (cluster.x * count)) / (count + 1);
        y = (p.y + (cluster.y * count)) / (count + 1);
        cluster.x = x;
        cluster.y = y;

        // Build an extent that includes all points in a cluster
        if ( p.x < cluster.attributes.extent[0] ) {
            cluster.attributes.extent[0] = p.x;
        } else if ( p.x > cluster.attributes.extent[2] ) {
            cluster.attributes.extent[2] = p.x;
        }
        if ( p.y < cluster.attributes.extent[1] ) {
            cluster.attributes.extent[1] = p.y;
        } else if ( p.y > cluster.attributes.extent[3] ) {
            cluster.attributes.extent[3] = p.y;
        }

        // Increment the count
        cluster.attributes.clusterCount++;
        // attributes might not exist
        if ( ! p.hasOwnProperty('attributes') ) {
            p.attributes = {};
        }
        // give the graphic a cluster id
        feature.attributes.clusterId = p.attributes.clusterId = cluster.attributes.clusterId;

        //TODO: put this back in
      //  on.emit(this, "on-add-point-to-cluster", {
      //    cluster: cluster,
      //    point: p
      //  });
    }

    private clusterCreate(feature, p) {
        var clusterId = this._clusters.length + 1;

        if ( ! p.attributes == null || p.attributes == undefined ) {
            p.attributes = {};
        }

        feature.attributes.clusterId = p.attributes.clusterId = clusterId;
        // create the cluster
        var cluster = {
            x: p.x,
            y: p.y,
            attributes : {
                clusterCount: 1,
                clusterId: clusterId,
                //population: p.population,
                city: feature.attributes["city"],
                population: feature.attributes["population"],
                extent: [ p.x, p.y, p.x, p.y ]
            }
        };
        this._clusters.push(cluster);

        //TODO: put this back in
       // on.emit(this, "on-add-point-to-cluster", {
       //   cluster: cluster,
       //   point: p
       // });
    }

    // Add all graphics to layer and fire 'clusters-shown' event
    private showAllClusters() {
        //debugger;

        for ( var i = 0, il = this._clusters.length; i < il; i++ ) {
            this.showCluster(this._clusters[i]);
        }
        //TODO: put this back in
        //this.emit('clusters-shown', this._clusters);
    }

    //Add graphic and to layer
    private showCluster(c) {
        var point = new this._esriPoint(c.x, c.y); //need spatial reference?

        //TODO: move this out of here
        let pointCount = c.attributes.clusterCount;
        let clusterSize =10;

        if (pointCount >= 100)
            clusterSize= 70;
        else if (pointCount >= 75)
            clusterSize = 60;
        else if (pointCount >= 50)
            clusterSize= 50;
         else if (pointCount >= 25)
            clusterSize= 40;
        else if (pointCount > 1)
            clusterSize= 30;
            
        var g = new this._graphic(point, null, c.attributes);

        //works
         g.symbol = {
            type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
            color: '#ff771d',
            //size: "40px",  // pixels
            size: clusterSize + "px"
          };

        this.cityLayer.graphics.add(g);

        // code below is used to not label clusters with a single point
       if ( pointCount < 2 ) {
           return;
        }

             var textSymbol = {
                type: "text",  // autocasts as new TextSymbol()
                color: "white",
                haloColor: "black",
                haloSize: "1px",
                text: pointCount,
                xoffset: 0,
                yoffset: -3,
                font: {  // autocast as new Font()
                  size: 13,
                  family: "sans-serif",
                  weight: "bold"
                }
              };

              debugger;

             this.cityLayer.graphics.add(new this._graphic(
                    point,
                    textSymbol,
                    c.attributes
                ));
    }

    private clusterTest (p :any, cluster:any) {
        var result = this._webMercatorUtils.lngLatToXY(p.x,p.y);
        var result1 = this._webMercatorUtils.lngLatToXY(cluster.x, cluster.y);

        var distance = (
            Math.sqrt(
                Math.pow((result1[0] - result[0]), 2) + Math.pow((result1[1] - result[1]), 2)
        ) / this._clusterResolution
        );

        return (distance <= this._clusterTolerance);
    }

    private reCluster () {
      //  debugger;
        //TODO: put this back in? cant find suspended
        //if (!this.suspended) {
            // update resolution
            this._clusterResolution = this._mapView.extent.width / this._mapView.width;

            this.clusterGraphics();
            //TODO: put all this back in ?
            // Smarter cluster, only query when we have to
            // Fist time
            // if (!this._visitedExtent) {
            //     this.getObjectIds(this._mapView.extent);
            // // New extent
            // } else if (!this._visitedExtent.contains(this._mapView.extent)) {
            //     this.getObjectIds(this._mapView.extent);
            // // Been there, but is this a pan or zoom level change?
            // } else {
            //     this.clusterGraphics();
            // }
            // // update clustered extent
            // this._visitedExtent = this._visitedExtent ? this._visitedExtent.union(this._mapView.extent) : this._mapView.extent;
        //}
    }

    private getNormalizedExtentsPolygon() {
     //   console.log('getNormalizedExtentsPolygon, clusters.length: ' + this._clusters.length);

        // normalize map extent and deal with up to 2 Extent geom objects,
        // convert to Polygon geom objects,
        // and combine into a master Polygon geom object to test against
        var normalizedExtents = this._mapView.extent.normalize();

        var normalizedExtentPolygons = normalizedExtents.map(extent=>{
            return this._polygon.fromExtent(extent);
        });
      
        var masterPolygon = new  this._polygon(this._mapView.spatialReference);

        normalizedExtentPolygons.forEach(polygon=>
            {
                masterPolygon.addRing(polygon.rings[0]);
            });

        return masterPolygon;
    }
}