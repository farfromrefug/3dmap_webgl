import {Texture2D, ProgramManager} from '@luma.gl/core';
import {AmbientLight, DirectionalLight} from '@deck.gl/core';
import {Effect} from '@deck.gl/core';
import {Matrix4, Vector3} from 'math.gl';
import OutlinePass from './outlinePass';
import {default as outline} from './outline';


// Class to manage ambient, point and directional light sources in deck
export default class OutlineEffect extends Effect {
  constructor(props) {
    super(props);
    // this.outlinePasses = [];
    // this.outlineMaps = [];

    // this._applyDefaultLights();

    // this.outline = this.directionalLights.some(light => light.shadow);
  }

  preRender(gl, {layers, layerFilter, viewports, onViewportActive, views}) {
// 
    if (!this.outlinePass) {
      this._createOutlinePass(gl);
    }
    if (!this.programManager) {
      // TODO - support multiple contexts
      this.programManager = ProgramManager.getDefaultProgramManager(gl);
      if (outline) {
        this.programManager.addDefaultModule(outline);
      }
    }

    if (!this.dummyOutlineMap) {
      this.dummyOutlineMap = new Texture2D(gl, {
        width: 1,
        height: 1
      });
    }

      this.outlinePass.render({
        layers,
        layerFilter,
        viewports,
        onViewportActive,
        views,
        moduleParameters: {
          dummyOutlineMap: this.dummyOutlineMap,
        }
      });
  }

  getModuleParameters(layer) {
    const parameters = this.shadow
      ? {
          outlineMap: this.outlineMap,
          dummyOutlineMap: this.dummyOutlineMap,
        //   shadowColor: this.shadowColor,
        //   shadowMatrices: this.shadowMatrices
        }
      : {};

    // when not rendering to screen, turn off lighting by adding empty light source object
    // lights shader module relies on the `lightSources` to turn on/off lighting
    // parameters.lightSources = {
    //   ambientLight: this.ambientLight,
    //   directionalLights: this.directionalLights.map(directionalLight =>
    //     directionalLight.getProjectedLight({layer})
    //   ),
    //   pointLights: this.pointLights.map(pointLight => pointLight.getProjectedLight({layer}))
    // };

    return parameters;
  }

  cleanup() {
    if (this.outlinePass) {
        this.outlinePass.delete();
        this.outlinePass= null;
    }

    if (this.dummyOutlineMap) {
      this.dummyOutlineMap.delete();
      this.dummyOutlineMap = null;
    }

    if (this.programManager) {
      this.programManager.removeDefaultModule(shadow);
      this.programManager = null;
    }
  }

  _createOutlinePass(gl) {
    this.outlinePass = new OutlinePass(gl);
    this.outlineMap = this.outlinePass.outlineMap;
  }
}