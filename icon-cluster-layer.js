import {CompositeLayer} from '@deck.gl/core';
import {IconLayer, TextLayer} from '@deck.gl/layers';
import Supercluster from 'supercluster';
import {ScatterplotLayer} from '@deck.gl/layers';
function getDefaultCharacterSet() {
    const charSet = [];
    for (let i = 32; i < 253; i++) {
      charSet.push(String.fromCharCode(i));
    }
    return charSet;
  }
  const CHAR_SET = getDefaultCharacterSet();
function extend(dest, src) {
    for (const id in src) dest[id] = src[id];
    return dest;
}
class MySupercluster extends Supercluster {
    _map(point, clone) {
        if (point.numPoints) {
            return clone ? extend({}, point.properties) : point.properties;
        }
        const originalPoint = this.points[point.index];
        const original = originalPoint.properties;
        const result = this.options.map(original,originalPoint);
        return clone && result === original ? extend({}, result) : result;
    }
}

function getIconName(size) {
  if (size === 0) {
    return '';
  }
  if (size < 10) {
    return `marker-${size}`;
  }
  if (size < 100) {
    return `marker-${Math.floor(size / 10)}0`;
  }
  return 'marker-100';
}

function getIconSize(size) {
  return Math.min(100, size) / 100 + 1;
}

export default class IconClusterLayer extends CompositeLayer {
//   shouldUpdateState({changeFlags}) {
//     return changeFlags.somethingChanged;
//   }

  updateState({props, oldProps, changeFlags}) {
    const rebuildIndex = changeFlags.dataChanged || props.sizeScale !== oldProps.sizeScale;
    // console.log('updateState', rebuildIndex, props.sizeScale)
    let superCluster = this.state.superCluster;
    if (rebuildIndex) {
        superCluster = new Supercluster({
          maxZoom: 16, 
          radius: props.sizeScale,
            // map: (props, point) => ({
            //     ...props,
            //     // geometry:point.geometry
            // }),
            // reduce: (accumulated, props) => { 
            //     if (props.name &&  (!accumulated.maxEle || (props.ele > accumulated.maxEle))) {
            //     // console.log('reduce', props, accumulated)
            //     // Object.assign(accumulated, props)
            //         accumulated.maxEle = props.ele;
            //         // accumulated.props = props;
            //     }
            //     // return accumulated;
            //     // accumulated.sum += props.sum;
            //  }
        });
        superCluster.load(
        props.data
      );
    //   this.setState({supercluster});
    }

    const z = Math.floor(this.context.viewport.zoom);
    if (rebuildIndex || z !== this.state.z) {
        const clusteredData = superCluster.getClusters([-180, -85, 180, 85], z);
        // console.log('clusteredData', props.data.length, clusteredData)
        this.setState({
            superCluster,
            clusteredData,
        z
      });
    }
  }

//   getPickingInfo({info, mode}) {
//     const pickedObject = info.object && info.object.properties;
//     if (pickedObject) {
//       if (pickedObject.cluster && mode !== 'hover') {
//         info.objects = this.state.index
//           .getLeaves(pickedObject.cluster_id, 25)
//           .map(f => f.properties);
//       }
//       info.object = pickedObject;
//     }
//     return info;
//   }
// renderLayers() {
//     const {data} = this.state;
//     const {iconAtlas, iconMapping, sizeScale} = this.props;
// return  new ScatterplotLayer({
//       id: `geojson`,
//       data,
//       radiusScale: 6,
//       getPosition: d => [...d.geometry.coordinates, d.properties.ele || 0],
//       lineWidthMinPixels: 10,
//       getRadius:10,
//       getFillColor: d => [255, 140, 0],
//       getLineColor: d => [0, 0, 0]
//     });
//     // return new IconLayer(
//     //   this.getSubLayerProps({
//     //     id: 'icon',
//     //     data,
//     //     iconAtlas,
//     //     iconMapping,
//     //     sizeScale,
//     //     getPosition: d => d.geometry.coordinates,
//     //     getIcon: d => getIconName(d.properties.cluster ? d.properties.point_count : 1),
//     //     getSize: d => getIconSize(d.properties.cluster ? d.properties.point_count : 1)
//     //   })
//     // );
//   }
  renderLayers() {
      const {data, clusteredData} = this.state;
    //   return null;
//   const {sizeScale} = this.props;
        return   [new ScatterplotLayer(
        this.getSubLayerProps({
        id: 'text',
        characterSet: CHAR_SET,
        data: clusteredData,
      getPosition: d => [...d.geometry.coordinates, d.properties.ele || 0],
        getSize: 16 ,
          maxWidth:400,
          getAngle: 90,
          getTextAnchor: 'start',
            getAlignmentBaseline: 'bottom',
            getText:'test'
        //   getText: (f, {index}) => {
        //     return (f.properties.name) ;
        //   },
      }
    ))];
  }
}