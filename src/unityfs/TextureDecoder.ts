import { Library } from 'ffi-napi';
import { DTypes as W } from 'win32-api';
import { Texture2D, TextureFormat } from './Objects/Texture2D';
import path from 'path';
import { log } from './Logger';

process.env.PATH = [process.env.PATH, path.resolve(__dirname, '../../bin')].join(';');
const TextureDecoder = Library('Texture2DDecoderNative', {
  DecodeDXT1: [W.BOOLEAN, [W.PVOID, W.INT, W.INT, W.PVOID]],
  DecodeDXT5: [W.BOOLEAN, [W.PVOID, W.INT, W.INT, W.PVOID]],
  DecodeBC4: [W.BOOLEAN, [W.PVOID, W.INT, W.INT, W.PVOID]],
  DecodeBC5: [W.BOOLEAN, [W.PVOID, W.INT, W.INT, W.PVOID]],
  DecodeBC6: [W.BOOLEAN, [W.PVOID, W.INT, W.INT, W.PVOID]],
  DecodeBC7: [W.BOOLEAN, [W.PVOID, W.INT, W.INT, W.PVOID]],
  DecodeETC1: [W.BOOLEAN, [W.PVOID, W.INT, W.INT, W.PVOID]],
  DecodeATCRGB4: [W.BOOLEAN, [W.PVOID, W.INT, W.INT, W.PVOID]],
  DecodeATCRGBA8: [W.BOOLEAN, [W.PVOID, W.INT, W.INT, W.PVOID]],
  DecodeEACR: [W.BOOLEAN, [W.PVOID, W.INT, W.INT, W.PVOID]],
  DecodeEACRSigned: [W.BOOLEAN, [W.PVOID, W.INT, W.INT, W.PVOID]],
  DecodeEACRG: [W.BOOLEAN, [W.PVOID, W.INT, W.INT, W.PVOID]],
  DecodeETC2: [W.BOOLEAN, [W.PVOID, W.INT, W.INT, W.PVOID]],
  DecodeETC2A1: [W.BOOLEAN, [W.PVOID, W.INT, W.INT, W.PVOID]],
  DecodeETC2A8: [W.BOOLEAN, [W.PVOID, W.INT, W.INT, W.PVOID]],
});

export async function getTextureBuffer(texture: Texture2D): Promise<Buffer> {
  const formatLogStr = `${texture.textureFormat}(${TextureFormat[texture.textureFormat]})`;
  log(`Loading texture '${texture.name}' type=${formatLogStr}`);
  switch (texture.textureFormat) {
    case TextureFormat.DXT1:
      return invokeDecoder(texture, 'DecodeDXT1');
    case TextureFormat.DXT5:
      return invokeDecoder(texture, 'DecodeDXT5');
    case TextureFormat.BC4:
      return invokeDecoder(texture, 'DecodeBC4');
    case TextureFormat.BC5:
      return invokeDecoder(texture, 'DecodeBC5');
    case TextureFormat.BC6H:
      return invokeDecoder(texture, 'DecodeBC6');
    case TextureFormat.BC7:
      return invokeDecoder(texture, 'DecodeBC7');
    case TextureFormat.ETC_RGB4:
    case TextureFormat.ETC_RGB4_3DS:
      return invokeDecoder(texture, 'DecodeETC1');
    case TextureFormat.ATC_RGB4:
      return invokeDecoder(texture, 'DecodeATCRGB4');
    case TextureFormat.ATC_RGBA8:
      return invokeDecoder(texture, 'DecodeATCRGBA8');
    case TextureFormat.EAC_R:
      return invokeDecoder(texture, 'DecodeEACR');
    case TextureFormat.EAC_R_SIGNED:
      return invokeDecoder(texture, 'DecodeEACRSigned');
    case TextureFormat.EAC_RG:
      return invokeDecoder(texture, 'DecodeEACRG');
    case TextureFormat.ETC2_RGB:
      return invokeDecoder(texture, 'DecodeETC2');
    case TextureFormat.ETC2_RGBA1:
      return invokeDecoder(texture, 'DecodeETC2A1');
    case TextureFormat.ETC2_RGBA8:
    case TextureFormat.ETC_RGBA8_3DS:
      return invokeDecoder(texture, 'DecodeETC2A8');
    default:
      throw new Error(`Unsupported format ${formatLogStr}`);
  }
}

export async function invokeDecoder(texture: Texture2D, format: keyof typeof TextureDecoder): Promise<Buffer> {
  const outBuffer = Buffer.alloc(texture.width * texture.height * 4);
  const sourceBuffer = texture.resourceReader.getData();
  const result: boolean = await new Promise<boolean>((resolve, reject) => {
    try {
      TextureDecoder[format].async(
        sourceBuffer,
        texture.width,
        texture.height,
        outBuffer,
        (err: Error, result: boolean) => (err ? reject(err) : resolve(result))
      );
    } catch (e) {
      reject(e);
    }
  });
  if (!result) {
    throw new Error(`An error ocurred decoding texture '${texture.name}' with ${format}`);
  }
  return outBuffer;
}
