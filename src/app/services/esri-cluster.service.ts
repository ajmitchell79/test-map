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
  _textSymbol: any;

  _esriPoint:any;

  classBreaksLayer: esri.GraphicsLayer;

  cityFeatures: any;
  cityGeometries: any;
  stateFeatures: any[] = [];

  stateTotals : any[] = [];

  //----------
  _clusters:any = [];  //the actual clusters
  _clusterData:any =[]; //the individual points

  _clusterResolution:any;
  _visitedExtent: any = null;
  _clusterTolerance = 50; //options.distance || 50; TODO:should this go back in? 

  _useDefaultSymbol: false;
  _defaultRenderer:any = {}; //TODO: this needs to be populated with something

  _singleSym :any;
  _simpleMarkerSymbol:any;;
  _dojoColor:any
  _clusterLabelColor:any ='#000';
  _clusterLabelOffset : number =-5;

  _font :any;

  _watchUtils:any;;

  _webMercatorUtils: any

 
  
  //------

  constructor() { 
    //debugger;
  }

  public createMap(mapElement :any) 
  {
    //debugger;

    // loadModules([
    //     'dojo/_base/declare',
    //     'dojo/_base/array',
    //     'dojo/_base/lang',
    //     'dojo/_base/Color',
    //     'dojo/_base/connect',
    //     'dojo/on',
    //     'dojo/promise/all',
    
    //     'esri/SpatialReference',
    //     'esri/geometry/Point',
    //     'esri/geometry/Polygon',
    //     'esri/geometry/Multipoint',
    //     'esri/geometry/Extent',
    //     'esri/graphic',
    
    //     'esri/config',
    //     'esri/geometry/normalizeUtils',
    
    //     'esri/symbols/SimpleMarkerSymbol',
    //     'esri/symbols/SimpleLineSymbol',
    //     'esri/symbols/SimpleFillSymbol',
    //     'esri/symbols/TextSymbol',
    //     'esri/symbols/Font',
    
    //     'esri/renderers/ClassBreaksRenderer',
    
    //     'esri/request',
    //     'esri/symbols/jsonUtils',
    //     'esri/renderers/jsonUtils',
    
    //     'esri/dijit/PopupTemplate',
    //     'esri/layers/GraphicsLayer',
    //     'esri/tasks/query',
    //     'esri/tasks/QueryTask',

    //     'esri/Map',
    //   'esri/views/MapView',
    //   "esri/layers/FeatureLayer",
    //   "esri/symbols/SimpleLineSymbol",
    //   "esri/geometry/geometryEngine"
    // ])
    //   .then(([
    //     declare, arrayUtils, lang, Color, connect, on, all,
    //     SpatialReference, Point, Polygon, Multipoint, Extent, Graphic,
    //     esriConfig, normalizeUtils,
    //     SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, TextSymbol, Font,
    //     ClassBreaksRenderer,
    //     esriRequest, symbolJsonUtils, rendererJsonUtil,
    //     PopupTemplate, GraphicsLayer, Query, QueryTask,
    //     EsriMap, EsriMapView,EsriFeatureLayer,EsriSimpleLineSymbol, geometryEngine

    //   ]) => {

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
            'esri/geometry/support/webMercatorUtils'
          ])
            .then(([EsriMap, EsriMapView,EsriGraphicsLayer, EsriGraphic, EsriSimpleLineSymbol, 
                EsriFeatureLayer, geometryEngine,
                EsriPoint, TextSymbol,Polygon,SimpleMarkerSymbol, dojoColor,Font,watchUtils,webMercatorUtils
            ]) => {

        this._graphic = EsriGraphic;
        this._graphicsLayer = EsriGraphicsLayer;
        this._featureLayer = EsriFeatureLayer;
        this. _simpleLineSymbol = EsriSimpleLineSymbol;
        this._mapView = EsriMapView;
        //this._geometryEngine = new geometryEngine();
        this._geometryEngine = geometryEngine;

        this._esriPoint = EsriPoint;
        this._textSymbol = TextSymbol;
        this._polygon = Polygon;
        this._simpleMarkerSymbol  = SimpleMarkerSymbol;
        this._dojoColor = dojoColor;
        this._font = Font;
        this._watchUtils = watchUtils;

        this._webMercatorUtils = webMercatorUtils;

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

          let that = this;

           //https://developers.arcgis.com/javascript/latest/sample-code/sandbox/index.html?sample=watch-for-changes
           //extent change
          watchUtils.whenTrue(this._mapView, "stationary", function() {

            debugger;
            that.reCluster();

            
            // Get the new center of the view only when view is stationary.
            if (that._mapView.center) {
              var info = "<br> <span> the view center changed. </span> x: " +
              that._mapView.center.x.toFixed(2) + " y: " + that._mapView.center.y.toFixed(2);

              console.log(info);
                debugger;

            }
          
            // Get the new extent of the view only when view is stationary.
           
          });


        }, err => {
          console.error(err);
        });

        

        //    this._mapView.on("click", function (event) {
        //     debugger;
        //    });
           


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

    console.log('Add city layer graphics');

    //-----------

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
          symbol: markerSymbol,
          //attributes : {"objectId":count, "name": "f"+ count, "rating": Math.floor(Math.random() * 11)},
          attributes : {"clusterId":null},
        });

          
        //--
        //this.cityLayer.graphics.add(pointGraphic);
        this._clusterData.push(pointGraphic);
      });

      //debugger;
      //this.clusterGraphics();
      this.reCluster();

      //TODO: is this needed?
    //this._map.add(this.cityLayer);

    //set view to exent of graphics layer
    //this._mapView.goTo( this.cityLayer.graphics).then(function () {
    
      //that._mapView.zoom = that._mapView.zoom - 1;
    //});
  }

  //-------

  private concat(a1, a2) {
    return a1.concat(a2);
    }

    private merge(arrs) {
        //var start = new Date().valueOf();
        //console.debug('merge start');
        var len = arrs.length, target = [];
        while (len--) {
            var o = arrs[len];
            if (o.constructor === Array) {
                target = this.concat(target, o);
            } else {
                target.push(o);
            }
        }
        //var end = new Date().valueOf();
        //console.debug('merge end', (end - start)/1000);
        return target;
    }

    private difference(arr1/*new objectIds*/, cacheCount/*objectId cache length*/, hash/*objecid hash*/) {
        //var start = new Date().valueOf();
        //console.debug('difference start');

        var len = arr1.length, diff = [];
        if (!cacheCount) {
            diff = arr1;
            while (len--) {
                var value = arr1[len];
                if (!hash[value]) {
                    hash[value] = value;
                }
            }

            //var endEarly = new Date().valueOf();
            //console.debug('difference end', (endEarly - start)/1000);

            return diff;
        }
        while (len--) {
            var val = arr1[len];
            if (!hash[val]) {
                hash[val] = val;
                diff.push(val);
            }
        }

        //var end = new Date().valueOf();
        //console.debug('difference end', (end - start)/1000);

        return diff;
    }

    private toPoints(features) {
        var len = features.length;
        var points = [];
        while (len--) {
            var g = features[len];
            points.push(
                new this._graphic(
                    g.geometry.getCentroid(),
                    g.symbol, g.attributes,
                    g.infoTemplate
            ));
        }
        return points;
    }

    private clear() {
        console.log('Clear, clusters.length: ' + this._clusters.length);

        // Summary:    Remove all clusters and data points.
        //this.inherited(arguments);
        this._clusters.length = 0;

       this.cityLayer.graphics.removeAll();
    }

    private getObjectIds (extent :any) {
        console.log('getObjectIds, clusters.length: ' + this._clusters.length);

        // debug
        // this._startGetOids = new Date().valueOf();
        // console.debug('#_getObjectIds start');

        //TODO: put back in? how?
        // if (this.url) {
        //     var ext = extent || this._map.extent;
        //     this._query.objectIds = null;
        //     if (this._where) {
        //         this._query.where = this._where;
        //     }
        //     if (!this.MODE_SNAPSHOT) {
        //         this._query.geometry = ext;
        //     }
        //     if (!this._query.geometry && !this._query.where) {
        //         this._query.where = '1=1';
        //     }
        //     this.queryTask.executeForIds(this._query).then(
        //         lang.hitch(this, '_onIdsReturned'), this._onError
        //     );
        // }
    }

    private getRenderedSymbol (feature :any) {
        console.log('getRenderedSymbol, clusters.length: ' + this._clusters.length);
        var attr = feature.attributes;
        if (attr.clusterCount === 1) {
            if (!this._useDefaultSymbol) {
                return this._singleSym;
            }
            var rend = this._defaultRenderer;
            if (!rend) { // something went wrong getting default renderer
                return null;
            } else {
                //TODO: is this right?
                return this._singleSym;
                //return rend.getSymbol(feature);
            }
        } else {
            return null;
        }
    }

    private add(p:any) {
        console.log('add, clusters.length: ' + this._clusters.length);
        // Summary:    The argument is a data point to be added to an existing cluster. If the data point falls within an existing cluster, it is added to that cluster and the cluster's label is updated. If the new point does not fall within an existing cluster, a new cluster is created.
        //
        // if passed a graphic, use the GraphicsLayer's add method
        //if ( p.declaredClass ) {
        //    this.inherited(arguments);
        //    return;
       // }

        // add the new data to _clusterData so that it's included in clusters when the map level changes
        this._clusterData.push(p);
        //this.cityLayer.graphics.add(g);

        var clustered = false;
        // look for an existing cluster for the new point
        for ( var i = 0; i < this._clusters.length; i++ ) {
            var c = this._clusters[i];
            if ( this.clusterTest(p, c) ) {
                // add the point to an existing cluster
                this.clusterAddPoint(p, c,null); //******* ADDED NULL HERE******************** */
                // update the cluster's geometry
                this.updateClusterGeometry(c);
                // update the label
               // this._updateLabel(c);
                clustered = true;
                break;
            }
        }

        if (!clustered) {
            this.clusterCreate(p, null);  //******* ADDED NULL HERE******************** */
            p.attributes.clusterCount = 1;
            this.showCluster(p);
        }
    }

    private clusterAddPoint(feature :any, p:any, cluster:any) {
        //console.log('clusterAddPoint, clusters.length: ' + this._clusters.length);
      //  debugger;
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
        console.log('clusterCreate, clusters.length: ' + this._clusters.length);
        console.log('Feature');
        console.log(feature);
        console.log('p');
        console.log(p);
        var clusterId = this._clusters.length + 1;
        // console.log('cluster create, id is: ', clusterId);
        // p.attributes might be undefined
        if ( ! p.attributes == null || p.attributes == undefined ) {
            p.attributes = {};
        }
        feature.attributes.clusterId = p.attributes.clusterId = clusterId;
        // create the cluster
        var cluster = {
            'x': p.x,
            'y': p.y,
            'attributes' : {
                'clusterCount': 1,
                'clusterId': clusterId,
                'extent': [ p.x, p.y, p.x, p.y ]
            }
        };
        this._clusters.push(cluster);

        //TODO: put this back in
       // on.emit(this, "on-add-point-to-cluster", {
       //   cluster: cluster,
       //   point: p
       // });
    }

    private updateClusterGeometry(c:any) {
        console.log('updateClusterGeometry, clusters.length: ' + this._clusters.length);
        console.log('c');
        console.log(c);
        // find the cluster graphic

        //TODO: is this._Clusters correct here?
        var cg = this._clusters.filter(g=>{
            return ! g.symbol &&
               g.attributes.clusterId === c.attributes.clusterId;
        });
        
       // var cg = arrayUtils.filter(this.graphics, function(g) {
       //     return ! g.symbol &&
        //        g.attributes.clusterId === c.attributes.clusterId;
        //});

        if ( cg.length === 1 ) {
            cg[0].geometry.update(c.x, c.y);
        } else {
           console.log('didn not find exactly one cluster geometry to update: ', cg);
        }
    }

    //-------

    // Build new cluster array from features and draw graphics
    public clusterGraphics() {
        debugger;
        console.log('clusterGraphics, clusters.length: ' + this._clusters.length);
        // debug
        // var start = new Date().valueOf();
        // console.debug('#_clusterGraphics start');

        // TODO - should test if this is a pan or zoom level change before reclustering

      //  debugger;

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
                this.clusterCreate(feature, point);
            }
        }

        this.showAllClusters();

        // debug
        // var end = new Date().valueOf();
        // console.debug('#_clusterGraphics end - ClusterData: ' + this._clusterData.length + ' Clusters: ' + this._clusters.length, (end - start)/1000);

     
    }

    // Add all graphics to layer and fire 'clusters-shown' event
    private showAllClusters() {
        debugger;
        console.log('showAllClusters, clusters.length: ' + this._clusters.length);
        // debug
        // var start = new Date().valueOf();
        // console.debug('#_showAllClusters start');

        for ( var i = 0, il = this._clusters.length; i < il; i++ ) {
            this.showCluster(this._clusters[i]);
        }
        //TODO: put this back in
        //this.emit('clusters-shown', this._clusters);

        // debug
        // var end = new Date().valueOf();
        // console.debug('#_showAllClusters end', (end - start)/1000);
    }

    //Add graphic and to layer
    private showCluster(c) {
        console.log('showCluster, clusters.length: ' + this._clusters.length);
        console.log('c');
        console.log(c);
        //debugger;
        //var point = new this._esriPoint(c.x, c.y, this._sr);
        var point = new this._esriPoint(c.x, c.y); //need spatial reference?

        var g = new this._graphic(point, null, c.attributes);
        //g.setSymbol(this.getRenderedSymbol(g));
        //g.symbol = this.getRenderedSymbol(g);
        //works
         g.symbol = {
            type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
            color: '#ff771d',
            size: "40px",  // pixels
          };


          //----
        //this.add(g);
        this.cityLayer.graphics.add(g);

        // code below is used to not label clusters with a single point
        if ( c.attributes.clusterCount < 2 ) {
            return;
        }

        // show number of points in the cluster -- BACK IN FOR LABELS
        //TODO: back in
        // var label = new this._textSymbol(c.attributes.clusterCount.toString())
        //     .setColor(new this._dojoColor(this._clusterLabelColor))
        //     .setOffset(0, this._clusterLabelOffset)
        //     .setFont(this._font);
        
            //this.add(
           // this.cityLayer.graphics.add(new this._graphic(
           //     point,
           //    // label,
           //     c.attributes
           // )
        //);
    }

    private clusterTest (p :any, cluster:any) {
        // console.log('clusterTest, clusters.length: ' + this._clusters.length);
        // console.log('p');
        // console.log(p);
        // console.log('cluster');
        // console.log(cluster);
       // debugger;

        var result = this._webMercatorUtils.lngLatToXY(p.x,p.y);
        var result1 = this._webMercatorUtils.lngLatToXY(cluster.x, cluster.y);

        var distance = (
            Math.sqrt(
                Math.pow((result1[0] - result[0]), 2) + Math.pow((result1[1] - result[1]), 2)
        ) / this._clusterResolution
        );

        // var distance = (
        //     Math.sqrt(
        //         Math.pow((cluster.x - p.x), 2) + Math.pow((cluster.y - p.y), 2)
        // ) / this._clusterResolution
        // );
        return (distance <= this._clusterTolerance);
    }

    ///
    ///TODO: this needs to be called on extent change
    ///
    private reCluster () {

        console.log('reCluster, clusters.length: ' + this._clusters.length);

        debugger;
       
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
        console.log('getNormalizedExtentsPolygon, clusters.length: ' + this._clusters.length);

        // normalize map extent and deal with up to 2 Extent geom objects,
        // convert to Polygon geom objects,
        // and combine into a master Polygon geom object to test against
        var normalizedExtents = this._mapView.extent.normalize();

         //TODO: put this back in
       // var normalizedExtentPolygons = arrayUtils.map(normalizedExtents, function(extent) {
        //    return Polygon.fromExtent(extent);
        //});

        var normalizedExtentPolygons = normalizedExtents.map(extent=>{
            return this._polygon.fromExtent(extent);
        });
      
        var masterPolygon = new  this._polygon(this._mapView.spatialReference);

        normalizedExtentPolygons.forEach(polygon=>
            {
                masterPolygon.addRing(polygon.rings[0]);
            });

        
        //TODO: put this back in
      //  arrayUtils.forEach(normalizedExtentPolygons, function(polygon) {
       //     masterPolygon.addRing(polygon.rings[0]);
       // });

        return masterPolygon;
    }
 
}

/* ______________________________________________________________________ */


   
