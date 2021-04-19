import React, {useState, useCallback} from 'react';
import {render} from 'react-dom';

import DeckGL from '@deck.gl/react';
import {MapView, CompositeLayer} from '@deck.gl/core';
import {TileLayer} from '@deck.gl/geo-layers';
import {BitmapLayer, PathLayer} from '@deck.gl/layers';
import {TerrainLayer} from '@deck.gl/geo-layers';
import {MVTLayer} from '@deck.gl/geo-layers';
import {GeoJsonLayer, IconLayer, TextLayer} from '@deck.gl/layers';
import OutlineEffect from './OutlineEffect';
import {BrushingExtension} from '@deck.gl/extensions';
const brushingExtension = new BrushingExtension();
import {FirstPersonView, OrthographicView} from '@deck.gl/core';
import {LineLayer, PolygonLayer} from '@deck.gl/layers';
import {PostProcessEffect} from '@deck.gl/core';
// import {edgeWork,dotScreen,  zoomBlur} from '@luma.gl/shadertools';

import {LightingEffect, AmbientLight, _SunLight as SunLight} from '@deck.gl/core';

function getDefaultCharacterSet() {
  const charSet = [];
  for (let i = 32; i < 253; i++) {
    charSet.push(String.fromCharCode(i));
  }
  return charSet;
}
const CHAR_SET = getDefaultCharacterSet();

/* global window */
const devicePixelRatio = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

export default function App() {
  console.log('devicePixelRatio', devicePixelRatio, new Error().stack);
  const terrainLayer = new TerrainLayer({
    id: 'terrain',
    refinementStrategy: 'never',
    meshMaxError: 10,
    minZoom: 5,
    maxZoom: 11,
    elevationDecoder: {
      rScaler: 256,
      gScaler: 1,
      bScaler: 1 / 256,
      offset: -32768
    },
    elevationData: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
    bounds: [-122.5233, 37.6493, -122.3566, 37.8159]
  });
  const tileLayer = new TileLayer({
    minZoom: 0,
    maxZoom: 18,
    tileSize: 512 / devicePixelRatio,
    data:
      'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    renderSubLayers: (props) => {
      const {
        bbox: {west, south, east, north}
      } = props.tile;

      return [
        new BitmapLayer(props, {
          data: null,
          image: props.data,
          bounds: [west, south, east, north]
        })
      ];
    }
  });
  let currentViewPort;

  function getScreenPosition(pos, d) {
    return pos;
    if (currentViewPort) {
      const result = currentViewPort.project(pos);
      return result;
    }
  }
  const mvtlayer = new MVTLayer({
    id: 'mvt',
    data: `https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.pbf?key=V7KGiDaKQBCWTYsgsmxh`,

    minZoom: 0,
    maxZoom: 14,
    loadOptions: {
      mvt: {
        layers: ['mountain_peak']
      }
    },

    getFillColor: (f) => {
      switch (f.properties.layer) {
        case 'water':
          return [140, 0, 180];
        case 'moutain_peak':
          return [255, 0, 0];
        case 'landcover':
          return [120, 190, 100];
        default:
          return [218, 218, 218];
      }
    },
    getPointRadius: 100,
    pointRadiusMinPixels: 2,
    renderSubLayers: (tile) => {
      const data = tile.data && tile.data.filter((f) => f.properties.name);
      return [
        new LineLayer({
          ...tile,
          id: `${tile.id}-line`,
          data,
          getWidth: 5,
          billboard: true,
          binary: true,
          getColor: [0, 0, 0],
          getSourcePosition: (d) =>
            getScreenPosition([...d.geometry.coordinates, 0], d),
          getTargetPosition: (d) =>
            getScreenPosition([...d.geometry.coordinates, (d.properties.ele || 0) + 220], d)
        }),
        new TextLayer({
          ...tile,
          data,
          id: `${tile.id}-text`,
          characterSet: CHAR_SET,
          getPosition: (d) =>
          getScreenPosition([...d.geometry.coordinates, (d.properties.ele || 0) + 220], d),
          getSize: 16,
          getAngle: 40,
          getTextAnchor: 'start',
          getAlignmentBaseline: 'center',
          getText: (f, {index}) => f.properties.name
        })
      ];
    }
  });

  function layerFilter({layer, viewport}) {
    if (viewport.id === 'minimap') {
      currentViewPort = viewport;
      if (layer.id.indexOf('-text') !== -1 || layer.id.indexOf('-line') !== -1) {
        return true;
      }
      return false;
    } else {
      if (layer.id.indexOf('-text') !== -1 || layer.id.indexOf('-line') !== -1) {
        return false;
      }
    }
    return true;
  }
  const mainView = new FirstPersonView({
    id: 'main',
    near: 10,
    far: 60000,
    focalDistance: 1000,
    controller:true
  });

  const [viewStates, setViewStates] = useState({
    main:{
      latitude: 45.171547,
      longitude: 5.722387,
      zoom: 13.5,
      maxZoom: 20,
      pitch: 0,
      position: [0, 0, 600],
      maxPitch: 90,
      bearing: 0
    }
  });

  const ambientLight = new AmbientLight({
    color: [255, 255, 255],
    intensity: 1
  });
  
  const dt = new Date();
  dt.setHours(dt.getHours() + 0);
  const sunlight = new SunLight({
    // _shadow:true,
    timestamp: dt.valueOf(),
    color: [255, 255, 255],
    intensity: 1
  });
  const lightingEffect = new LightingEffect({ambientLight, sunlight});
  lightingEffect.shadowColor = [0, 0, 0, 0.5];
  const outlineEffect = new OutlineEffect();
  return (
    <DeckGL
    glOptions={{ webgl2: true }}
      effects={[outlineEffect]}
      layerFilter={layerFilter}
      layers={[terrainLayer, mvtlayer]}
      views={[
        mainView,
        new FirstPersonView({
    id: 'minimap',
    near: 10,
    far: 30000,
    focalDistance: 1000
    , viewState: {id: 'main'}
  }),
    //     new OrthographicView({
    //       // far:100,
    // flipY: false,
    //       id: 'minimap',
    //       controller: false
    // , viewState: {id: 'main'}
    //     })
      ]}
      initialViewState={viewStates}
    />
  );
}

export function renderToDOM(container) {
  render(<App />, container);
}
