var app, mapView, searchWidgetNav, searchWidgetPanel;

require(["esri/Map",
  "esri/Basemap",
  "esri/views/MapView",
  "esri/views/SceneView",
  "esri/layers/FeatureLayer",
  "esri/widgets/Search",
  "esri/core/watchUtils",
  "dojo/query",

  "dojo/domReady!"
], function(Map, Basemap, MapView, SceneView, FeatureLayer, Search, watchUtils, query) {
  $(document).ready(function() {
    app = {
      scale: 500000,
      center: [117.163, 34.065, 446.477],
      camera: {
        position: {
          x: -117.240,
          y: 34.031,
          z: 1573.336 // elevation in meters
        },
        tilt: 82.082,
        heading: 60.586
      },
      basemap: "streets",
      viewPadding: {
        bottom: 0
      },
      ground: "world-elevation",
      uiPadding: {
        bottom: 30
      },
      mapView: null,
      sceneView: null,
      activeView: null
    };

    // Map
    var map = new Map({
      basemap: app.basemap
    });
    app.mapView = new MapView({
      container: "mapViewDiv",
      map: map,
      scale: app.scale,
      center: app.center,
      padding: app.viewPadding,
      ui: {
        components: ["zoom", "compass", "attribution"],
        padding: app.uiPadding,
        position: "top-right"
      }
    });

    // Scene
    var mapScene = new Map({
      basemap: app.basemap,
      ground: app.ground
    });
    app.sceneView = new SceneView({
      container: "sceneViewDiv",
      map: mapScene,
      scale: app.scale,
      center: app.center,
      padding: app.viewPadding,
      camera: app.camera,
      ui: {
        components: ["zoom", "compass", "attribution"],
        padding: app.uiPadding
      },
      visible: true
    });

    app.activeView = app.sceneView;

    // Search
    app.activeView.then(function() {
      searchWidgetNav = createSearchWidget("searchNavDiv");
      searchWidgetPanel = createSearchWidget("searchPanelDiv");
      show3DParams();
      app.sceneView.watch('camera', function() {
        //displays the map center and camera values
        show3DParams();
      });

      $("#showElevation").click(function() {
        console.log("click");
        updateElevation();
      });

      function updateElevation(ev) {
        console.log("click2");
        // Turn ground layers visibility on/off
        app.sceneView.map.ground.layers.forEach(function(layer) {
          layer.visible = layer.visible ? false : true;
          console.log(layer.visible);
          //layer.visible = ev.target.checked;
        });
      }
    });

    function createSearchWidget(parentId) {
      var search = new Search({
        viewModel: {
          view: app.activeView,
          highlightEnabled: false,
          popupEnabled: false,
          showPopupOnSelect: false
        }
      }, parentId);
      search.startup();
      return search;
    }

    function syncViews(fromView, toView) {
      function sync() {
        toView.set({
          viewpoint: fromView.viewpoint
        });
      }
      if (toView.isInstanceOf(SceneView) && !toView.ready) {
        watchUtils.whenTrueOnce(toView, "ready").then(function(isReady) {
          if (isReady) {
            sync();
          }
        });
      } else {
        sync();
      }
    }

    query("nav li a[data-toggle='tab']").on("click", function(e) {
      // Sync views
      if (e.target.text === "Map") {
        syncViews(app.sceneView, app.mapView);
        app.activeView = app.mapView;
      } else {
        syncViews(app.mapView, app.sceneView);
        app.activeView = app.sceneView;
      }
      // Set search
      searchWidgetNav.viewModel.view = app.activeView;
      searchWidgetPanel.viewModel.view = app.activeView;
    });

    query("#selectBasemapPanel").on("change", function(e) {
      //mapView.map.basemap = e.target.options[e.target.selectedIndex].dataset.vector;
      app.mapView.map.basemap = e.target.value;
      app.sceneView.map.basemap = e.target.value;
    });


    function show3DParams(evt) {
      //center text
      var latCoord = app.sceneView.center.latitude.toFixed(3);
      var longCoord = app.sceneView.center.longitude.toFixed(3);
      var centerCoords = longCoord + ", " + latCoord;
      $("#centerLatLong").html(centerCoords);

      var xWebMerc = app.sceneView.center.x.toFixed(3);
      var yWebMerc = app.sceneView.center.y.toFixed(3);
      var centerCoordsMercator = "(" + xWebMerc + ", " + yWebMerc + ")";
      $("#centerWebMerc").html(centerCoordsMercator);

      var zVal = app.sceneView.center.z.toFixed(3);
      $("#centerZVal").html(zVal);


      //camera text
      var fov = app.sceneView.camera.fov.toFixed(3);
      $("#cameraFOV").val(fov + "&deg;");

      var heading = app.sceneView.camera.heading.toFixed(3);
      $("#cameraHeading").html(heading + "&deg;");

      var tilt = app.sceneView.camera.tilt.toFixed(3);
      $("#cameraTilt").html(tilt + "&deg;");

      var camLatCoord = app.sceneView.camera.position.latitude.toFixed(3);
      var camLongCoord = app.sceneView.camera.position.longitude.toFixed(3);
      var camCoords = "(" + camLongCoord + ", " + camLatCoord + ")";
      $("#cameraLatLong").html(camCoords);

      var camXWebMerc = app.sceneView.camera.position.x.toFixed(3);
      var camYWebMerc = app.sceneView.camera.position.y.toFixed(3);
      var camCoordsMercator = "(" + camXWebMerc + ", " + camYWebMerc + ")";
      $("#cameraWebMerc").html(camCoordsMercator);

      var camZVal = app.sceneView.camera.position.z.toFixed(3);
      $("#cameraZVal").html(camZVal);
    }

  }); // dojo
});
