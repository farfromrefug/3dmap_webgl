import {_LayersPass as LayersPass} from '@deck.gl/core';
import {
  Framebuffer,
  Texture2D,
  Renderbuffer,
  withParameters,
  cssToDeviceRatio
} from '@luma.gl/core';

export default class OutlinePass extends LayersPass {
  constructor(gl, props) {
    super(gl, props);

    // The shadowMap texture
    this.outlineMap = new Texture2D(gl, {
      width: 1,
      height: 1,
      parameters: {
        [gl.TEXTURE_MIN_FILTER]: gl.LINEAR,
        [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
        [gl.TEXTURE_WRAP_S]: gl.CLAMP_TO_EDGE,
        [gl.TEXTURE_WRAP_T]: gl.CLAMP_TO_EDGE
      }
    });

    this.depthBuffer = new Renderbuffer(gl, {
      format: gl.DEPTH_COMPONENT16,
      width: 1,
      height: 1
    });

    this.fbo = new Framebuffer(gl, {
      id: 'outlinemap',
      width: 1,
      height: 1,
      attachments: {
        [gl.COLOR_ATTACHMENT0]: this.outlineMap,
        // Depth attachment has to be specified for depth test to work
        [gl.DEPTH_ATTACHMENT]: this.depthBuffer
      }
    });
  }

  render(params) {
    const target = this.fbo;

    withParameters(
      this.gl,
      {
        depthRange: [0, 1],
        depthTest: true,
        blend: false,
        clearColor: [1, 1, 1, 1]
      },
      () => {
        const viewport = params.viewports[0];
        const pixelRatio = cssToDeviceRatio(this.gl);
        const width = viewport.width * pixelRatio;
        const height = viewport.height * pixelRatio;
        if (width !== target.width || height !== target.height) {
          target.resize({width, height});
        }

        super.render({...params, target, pass: 'outline'});
      }
    );
  }

  shouldDrawLayer(layer) {
    return layer.props.outlineEnabled !== false;
  }

  getModuleParameters() {
    return {
      drawToOutlineMap: true
    };
  }

  delete() {
    if (this.fbo) {
      this.fbo.delete();
      this.fbo = null;
    }

    if (this.outlineMap) {
      this.outlineMap.delete();
      this.outlineMap = null;
    }

    if (this.depthBuffer) {
      this.depthBuffer.delete();
      this.depthBuffer = null;
    }
  }
}