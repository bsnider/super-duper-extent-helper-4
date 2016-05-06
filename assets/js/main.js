var app, mapView, searchWidgetNav, searchWidgetPanel;

require(["esri/Map",
  "esri/Basemap",
  "esri/views/MapView",
  "esri/views/SceneView",
  "esri/layers/FeatureLayer",
  "esri/widgets/Search",
  "esri/core/watchUtils",
  "dojo/query",
  "esri/geometry/Point",

  "dojo/domReady!"
], function(Map, Basemap, MapView, SceneView, FeatureLayer, Search, watchUtils, query, Point) {
  $(document).ready(function() {
    app = {
      scale: 500000,
      center: [-117.163, 34.065, 446.477],
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

    // MAP VIEW //////////////////////////////////////////////////////////////////////////
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

    // SCENE VIEW //////////////////////////////////////////////////////////////////////////
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

    // EXECUTE AFTER MAP INIT //////////////////////////////////////////////////////////////////////////
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

    // CREATE SEARCH WIDGET //////////////////////////////////////////////////////////////////////////
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

    // TOGGLE BETWEEN 2D AND 3D //////////////////////////////////////////////////////////////////////////
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

    // CHANGE BASEMAP //////////////////////////////////////////////////////////////////////////
    query("#selectBasemapPanel").on("change", function(e) {
      //mapView.map.basemap = e.target.options[e.target.selectedIndex].dataset.vector;
      app.mapView.map.basemap = e.target.value;
      app.sceneView.map.basemap = e.target.value;
    });

    // REFRESH CENTER //////////////////////////////////////////////////////////////////////////

    // CENTER LAT LONG
    $("#centerLatLongRefresh").click(function(evt) {
      var inputRef = $("#" + evt.currentTarget.id).parent().siblings()[0].id;
      var coords = $("#" + inputRef).val();
      centerLatLongRefresh(coords);
    });

    $('#centerLatLong').keypress(function(e) {
      if (e.which == 13) { //Enter key pressed
        var coords = $("#centerLatLong").val();
        centerLatLongRefresh(coords);
      }
    });

    function centerLatLongRefresh(value) {
      var coordsArray = value.split(', ').map(Number);
      app.sceneView.goTo(coordsArray)
        .then(function() {
          console.log(app.sceneView.center);


          // //convert center to string
          // var centerJSON = app.sceneView.center.toJSON();
          // //remove spatial reference key
          // delete centerJSON["spatialReference"];
          // //stringify
          // centerJSON = JSON.stringify(centerJSON, null, 2);
          // //remove quotes from keys
          // centerJSON = centerJSON.replace(/"(\w+)"\s*:/g, '$1:');
          //
          //
          //
          // //convert center to string
          // var cameraJSON = app.sceneView.camera.toJSON();
          // //remove spatial reference key
          // delete cameraJSON.position["spatialReference"];
          // //stringify
          // cameraJSON = JSON.stringify(cameraJSON, null, 2);
          // //remove quotes from keys
          // cameraJSON = cameraJSON.replace(/"(\w+)"\s*:/g, '$1:');
          //
          // console.log("center: " + centerJSON + ",\ncamera: " + cameraJSON);

        });
    }

    // CENTER WEB MERC
    $("#centerMercRefresh").click(function(evt) {
      var inputRef = $("#" + evt.currentTarget.id).parent().siblings()[0].id;
      var coords = $("#" + inputRef).val();
      centerMercRefresh(coords);
    });

    $('#centerWebMerc').keypress(function(e) {
      if (e.which == 13) { //Enter key pressed
        var coords = $("#centerWebMerc").val();
        centerMercRefresh(coords);
      }
    });

    function centerMercRefresh(value) {
      var coordsArray = value.split(', ').map(Number);
      var newCenter = app.sceneView.center.clone();
      newCenter.x = coordsArray[0];
      newCenter.y = coordsArray[1];

      app.sceneView.goTo({
          center: newCenter,
          //ensure camera position is maintained
          position: app.sceneView.camera.position
        })
        .then(function() {
          console.log(app.sceneView.center);
        });
    }

    // CENTER Z
    $("#centerZeeRefresh").click(function(evt) {
      var inputRef = $("#" + evt.currentTarget.id).parent().siblings()[0].id;
      var value = $("#" + inputRef).val();
      centerZeeRefresh(value);
    });

    $('#centerZVal').keypress(function(e) {
      if (e.which == 13) { //Enter key pressed
        var value = $("#centerZVal").val();
        centerZeeRefresh(value);
      }
    });

    function centerZeeRefresh(value) {
      var newCenter = app.sceneView.center.clone();
      newCenter.z = value;

      app.sceneView.goTo({
          center: newCenter,
          //ensure camera position is maintained
          position: app.sceneView.camera.position
        })
        .then(function() {
          console.log(app.sceneView.center);
        });
    }


    // REFRESH CAMERA //////////////////////////////////////////////////////////////////////////

    // CAMERA FOV
    $("#cameraFOVRefresh").click(function(evt) {
      var inputRef = $("#" + evt.currentTarget.id).parent().siblings()[0].id;
      var value = $("#" + inputRef).val();
      app.sceneView.goTo({
          fov: value
        })
        .then(function() {
          console.log(app.sceneView.camera);
        });
    });

    $('#cameraFOV').keypress(function(e) {
      if (e.which == 13) { //Enter key pressed
        var value = $("#cameraFOV").val();
        app.sceneView.goTo({
            fov: value
          })
          .then(function() {
            console.log(app.sceneView.camera);
          });
      }
    });

    //CAMERA HEADING
    $("#cameraHeadingRefresh").click(function(evt) {
      var inputRef = $("#" + evt.currentTarget.id).parent().siblings()[0].id;
      var value = $("#" + inputRef).val();
      cameraHeading(value)
    });

    $('#cameraHeading').keypress(function(e) {
      if (e.which == 13) { //Enter key pressed
        var value = $("#cameraHeading").val();
        cameraHeading(value)
      }
    });

    function cameraHeading(value) {
      app.sceneView.goTo({
          heading: value,
          //ensure tilt is maintained
          tilt: app.sceneView.camera.tilt
        })
        .then(function() {
          console.log(app.sceneView.camera);
        });
    }

    // CAMERA TILT
    $("#cameraTiltRefresh").click(function(evt) {
      var inputRef = $("#" + evt.currentTarget.id).parent().siblings()[0].id;
      var value = $("#" + inputRef).val();
      cameraTiltRefresh(value);
    });

    $('#cameraTilt').keypress(function(e) {
      if (e.which == 13) { //Enter key pressed
        var value = $("#cameraTilt").val();
        cameraTiltRefresh(value);
      }
    });

    function cameraTiltRefresh(value) {
      app.sceneView.goTo({
          tilt: value
        })
        .then(function() {
          console.log(app.sceneView.camera);
        });
    }

    // CAMERA LAT LONG
    $("#cameraLatLongRefresh").click(function(evt) {
      var inputRef = $("#" + evt.currentTarget.id).parent().siblings()[0].id;
      var coords = $("#" + inputRef).val();
      cameraLatLongRefresh(coords);
    });

    $('#cameraLatLong').keypress(function(e) {
      if (e.which == 13) { //Enter key pressed
        var coords = $("#cameraLatLong").val();
        cameraLatLongRefresh(coords);
      }
    });

    function cameraLatLongRefresh(value) {
      var coordsArray = value.split(', ').map(Number);
      var cam = app.sceneView.camera.clone();
      cam.position.longitude = coordsArray[0];
      cam.position.latitude = coordsArray[1];
      app.sceneView.goTo({
          //ensure center is maintained
          center: app.sceneView.center,
          position: cam.position
        })
        .then(function() {
          console.log(app.sceneView.camera);
        });
    }

    // CAMERA WEB MERC
    $("#cameraMercRefresh").click(function(evt) {
      var inputRef = $("#" + evt.currentTarget.id).parent().siblings()[0].id;
      var coords = $("#" + inputRef).val();
      cameraMercRefresh(coords);
    });

    $('#cameraWebMerc').keypress(function(e) {
      if (e.which == 13) { //Enter key pressed
        var coords = $("#cameraWebMerc").val();
        cameraMercRefresh(coords);
      }
    });

    function cameraMercRefresh(value) {
      var coordsArray = value.split(', ').map(Number);
      var cam = app.sceneView.camera.clone();
      cam.position.x = coordsArray[0];
      cam.position.y = coordsArray[1];
      app.sceneView.goTo({
          //ensure center is maintained
          center: app.sceneView.center,
          position: cam.position
        })
        .then(function() {
          console.log(app.sceneView.camera);
        });
    }

    // CAMERA Z
    $("#cameraZRefresh").click(function(evt) {
      var inputRef = $("#" + evt.currentTarget.id).parent().siblings()[0].id;
      var value = $("#" + inputRef).val();

      app.sceneView.goTo({
          tilt: value
        })
        .then(function() {
          console.log(app.sceneView.camera);
        });
    });

    $('#cameraZVal').keypress(function(e) {
      if (e.which == 13) { //Enter key pressed
        var value = $("#cameraZVal").val();
        cameraZRefresh(value);
      }
    });

    function cameraZRefresh(value) {
      var coordsArray = value.split(', ').map(Number);
      var cam = app.sceneView.camera.clone();
      cam.position.z = value;
      app.sceneView.goTo({
          //ensure center is maintained
          center: app.sceneView.center,
          position: cam.position
        })
        .then(function() {
          console.log(app.sceneView.camera);
        });
    }

    // COPY TEXT //////////////////////////////////////////////////////////////////////////
    $(".copyBtn").click(function(evt) {
      var inputRef = $("#" + evt.currentTarget.id).parent().siblings()[0].id;
      selectText(inputRef);
      setTimeout(function() {
        $(copyModal).modal('toggle');
      }, 1000);
    });

    function selectText(inputRef) {
      window.getSelection().removeAllRanges();
      $("#centerModalText").select();
      document.execCommand('copy');
      window.getSelection().removeAllRanges();
    }

    //paramsCopy
    $("#centerParamsCopy").click(function(evt) {
      window.getSelection().removeAllRanges();
      var copyTextarea = document.querySelector("#centerModalText");
      var range = document.createRange();
      range.selectNode(copyTextarea);
      window.getSelection().addRange(range);
      document.execCommand('copy');
      window.getSelection().removeAllRanges();
      setTimeout(function() {
        $(copyModal).modal('toggle');
      }, 1000);
    });

    $("#cameraParamsCopy").click(function(evt) {
      window.getSelection().removeAllRanges();
      var copyTextarea = document.querySelector("#cameraModalText");
      var range = document.createRange();
      range.selectNode(copyTextarea);
      window.getSelection().addRange(range);
      document.execCommand('copy');
      window.getSelection().removeAllRanges();
      setTimeout(function() {
        $(copyModal).modal('toggle');
      }, 1000);
    });

    // GET MAP PARAMS //////////////////////////////////////////////////////////////////////////
    function show3DParams(evt) {
      //center text
      var latCoord = app.sceneView.center.latitude.toFixed(3);
      var longCoord = app.sceneView.center.longitude.toFixed(3);
      var centerCoords = longCoord + ", " + latCoord;
      $("#centerLatLong").val(centerCoords);

      var xWebMerc = app.sceneView.center.x.toFixed(3);
      var yWebMerc = app.sceneView.center.y.toFixed(3);
      var centerCoordsMercator = xWebMerc + ", " + yWebMerc;
      $("#centerWebMerc").val(centerCoordsMercator);

      var zVal = app.sceneView.center.z.toFixed(3);
      $("#centerZVal").val(zVal);

      //camera text
      var fov = app.sceneView.camera.fov.toFixed(3);
      $("#cameraFOV").val(fov);

      var heading = app.sceneView.camera.heading.toFixed(3);
      $("#cameraHeading").val(heading);

      var tilt = app.sceneView.camera.tilt.toFixed(3);
      $("#cameraTilt").val(tilt);

      var camLatCoord = app.sceneView.camera.position.latitude.toFixed(3);
      var camLongCoord = app.sceneView.camera.position.longitude.toFixed(3);
      var camCoords = camLongCoord + ", " + camLatCoord;
      $("#cameraLatLong").val(camCoords);

      var camXWebMerc = app.sceneView.camera.position.x.toFixed(3);
      var camYWebMerc = app.sceneView.camera.position.y.toFixed(3);
      var camCoordsMercator = camXWebMerc + ", " + camYWebMerc;
      $("#cameraWebMerc").val(camCoordsMercator);

      var camZVal = app.sceneView.camera.position.z.toFixed(3);
      $("#cameraZVal").val(camZVal);

      var paramCenLong = "    longitude: " + longCoord + ",\n";
      var paramCenLat = "    latitude: " + latCoord + ",\n";
      var paramCenX = "    x: " + xWebMerc + ",\n";
      var paramCenY = "    y: " + yWebMerc + ",\n";
      var paramCenZ = "    z: " + zVal + "\n}";
      var paramsCenter = "center: {\n" + paramCenLong + paramCenLat + paramCenX + paramCenY + paramCenZ;

      var paramFov = "    fov: " + fov + ",\n";
      var paramHeading = "    heading: " + heading + ",\n";
      var paramTilt = "    tilt: " + tilt + ",\n";
      var paramCamLong = "        longitude: " + camLongCoord + ",\n";
      var paramCamLat = "        latitude: " + camLatCoord + ",\n";
      var paramCamX = "        x: " + camXWebMerc + ",\n";
      var paramCamY = "        y: " + camYWebMerc + ",\n";
      var paramCamZ = "        z: " + camZVal + "\n    },\n}";
      var paramsCamera = "camera: {\n" + paramFov + paramHeading + paramTilt + "    position: {\n" + paramCamLong + paramCamLat + paramCamX + paramCamY + paramCamZ;

      var params = paramsCenter + paramsCamera
      //$('#centerParamsCopy').tooltip({title: paramsCenter});
      $('#centerParamsCopy').hover(function() {
        $('#centerParamsCopy').tooltip({title: paramsCenter});
      });
      $('#cameraParamsCopy').tooltip({title: paramsCamera});

      $('#centerModalText').text(paramsCenter);
      $('#cameraModalText').text(paramsCamera);

    }

  });
});
