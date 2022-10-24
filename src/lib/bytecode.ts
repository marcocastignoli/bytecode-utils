import { arrayify, hexlify } from '@ethersproject/bytes';
import bs58 from 'bs58';
import * as CBOR from 'cbor-x/decode';

type CBOR = {
  bytes: string;
  length: number;
};

// eslint-disable-next-line functional/no-mixed-type
type DecodedObject = {
  cbor: CBOR;
  ipfs?: string;
  solcVersion?: string;
  [key: string]: string | CBOR | Uint8Array | undefined;
};

/**
 * Decode contract's bytecode
 * @param bytecode - hex of the bytecode
 * @returns Object describing the contract
 */
export const decode = (bytecode: string): DecodedObject => {
  if (bytecode.length === 0) {
    throw Error('Bytecode cannot be null');
  }
  // Take latest 2 bytes of the bytecode (length of the cbor object)
  const cborLength = parseInt(`${bytecode.slice(-4)}`, 16);

  // Extract the cbor object using the extracted lenght
  const cborRaw = bytecode.substring(
    bytecode.length - 4 - cborLength * 2,
    bytecode.length - 4
  );

  // cbor decode the object and get a json
  const cborDecodedObject = CBOR.decode(arrayify(`0x${cborRaw}`));

  const result: DecodedObject = {
    cbor: {
      bytes: `0x${cborRaw}`,
      length: cborLength,
    },
  };

  // Decode all the parameters from the json
  Object.keys(cborDecodedObject).forEach((key: string) => {
    switch (key) {
      case 'ipfs': {
        const ipfsCID = bs58.encode(cborDecodedObject.ipfs);
        result.ipfs = ipfsCID;
        break;
      }
      case 'solc': {
        result.solcVersion = cborDecodedObject.solc.join('.');
        break;
      }
      default: {
        result[key] = hexlify(cborDecodedObject[key]);
        break;
      }
    }
  });

  return result;
};
